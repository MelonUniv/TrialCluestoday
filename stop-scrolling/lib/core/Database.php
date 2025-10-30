<?php
/**
 * Database Connection Class
 * Singleton pattern for database connections
 */

require_once __DIR__ . '/../../config/app.php';

class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $this->connection = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
                ]
            );
        } catch (PDOException $e) {
            // Log error and show generic message
            error_log("Database connection failed: " . $e->getMessage());
            
            if (APP_DEBUG) {
                die("Database connection failed: " . $e->getMessage());
            } else {
                die("System error. Please try again later.");
            }
        }
    }
    
    /**
     * Get database instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get PDO connection
     */
    public function getConnection() {
        return $this->connection;
    }
    
    /**
     * Prevent cloning
     */
    private function __clone() {}
    
    /**
     * Prevent unserialization
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
    
    /**
     * Execute query with parameters
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query failed: " . $e->getMessage() . " SQL: " . $sql);
            throw new Exception("Database query failed");
        }
    }
    
    /**
     * Fetch single row
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->execute($sql, $params);
        return $stmt->fetch();
    }
    
    /**
     * Fetch all rows
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->execute($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Insert and return last insert ID
     */
    public function insert($table, $data) {
        $columns = array_keys($data);
        $values = array_map(function($col) { return ":$col"; }, $columns);
        
        $sql = "INSERT INTO " . DB_PREFIX . "$table (" . implode(', ', $columns) . ") 
                VALUES (" . implode(', ', $values) . ")";
        
        $this->execute($sql, $data);
        return $this->connection->lastInsertId();
    }
    
    /**
     * Update records
     */
    public function update($table, $data, $where, $whereParams = []) {
        $setParts = [];
        $params = [];
        
        foreach ($data as $column => $value) {
            $setParts[] = "$column = :set_$column";
            $params["set_$column"] = $value;
        }
        
        $sql = "UPDATE " . DB_PREFIX . "$table 
                SET " . implode(', ', $setParts) . " 
                WHERE $where";
        
        $params = array_merge($params, $whereParams);
        $stmt = $this->execute($sql, $params);
        
        return $stmt->rowCount();
    }
    
    /**
     * Delete records
     */
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM " . DB_PREFIX . "$table WHERE $where";
        $stmt = $this->execute($sql, $params);
        return $stmt->rowCount();
    }
    
    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    /**
     * Commit transaction
     */
    public function commit() {
        return $this->connection->commit();
    }
    
    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->connection->rollback();
    }
    
    /**
     * Check if table exists
     */
    public function tableExists($table) {
        $sql = "SHOW TABLES LIKE ?";
        $stmt = $this->execute($sql, [DB_PREFIX . $table]);
        return $stmt->rowCount() > 0;
    }
}