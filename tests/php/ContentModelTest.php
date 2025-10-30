<?php
require_once __DIR__ . '/../../stop-scrolling/lib/models/Content.php';

class FakeDatabase {
    public $lastSql;
    public $lastParams;
    public $countSql;
    public $countParams;

    public function fetchAll($sql, $params = []) {
        $this->lastSql = $sql;
        $this->lastParams = $params;
        return [
            [
                'content_id' => 'test-content',
                'title' => 'Focus Booster',
                'category' => 'memory_game'
            ]
        ];
    }

    public function fetchOne($sql, $params = []) {
        $this->countSql = $sql;
        $this->countParams = $params;
        return ['total' => 5];
    }
}

function assertContains(string $needle, string $haystack, string $message): void {
    if (strpos($haystack, $needle) === false) {
        throw new RuntimeException($message . "\nSQL: " . $haystack);
    }
}

function assertEquals($expected, $actual, string $message): void {
    if ($expected !== $actual) {
        throw new RuntimeException($message . "\nExpected: " . var_export($expected, true) . "\nActual: " . var_export($actual, true));
    }
}

$fakeDb = new FakeDatabase();
$content = new Content($fakeDb);

$filters = [
    'category' => 'memory_game',
    'difficulty' => 3,
    'search' => 'focus'
];
$pagination = [
    'limit' => 10,
    'offset' => 20
];

$content->getAll($filters, $pagination);

assertContains('category = ?', $fakeDb->lastSql, 'Category filter not applied.');
assertContains('difficulty_level = ?', $fakeDb->lastSql, 'Difficulty filter not applied.');
assertContains('(title LIKE ? OR description LIKE ?)', $fakeDb->lastSql, 'Search filter not applied.');
assertContains('LIMIT ? OFFSET ?', $fakeDb->lastSql, 'Pagination not applied.');

assertEquals(['memory_game', 3, '%focus%', '%focus%', 10, 20], $fakeDb->lastParams, 'Unexpected parameter ordering for getAll.');

$content->getCount($filters);
assertContains('COUNT(*) as total', $fakeDb->countSql, 'Count query should aggregate results.');
assertEquals(['memory_game', 3, '%focus%', '%focus%'], $fakeDb->countParams, 'Unexpected parameter ordering for getCount.');

echo "ContentModel tests passed" . PHP_EOL;
