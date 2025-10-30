<?php
/**
 * Simple JWT Implementation
 * Based on Firebase JWT but simplified for our needs
 */

class JWT {
    
    /**
     * Encode a payload into a JWT token
     */
    public static function encode($payload, $key, $algorithm = 'HS256') {
        $header = [
            'typ' => 'JWT',
            'alg' => $algorithm
        ];
        
        $header = self::base64UrlEncode(json_encode($header));
        $payload = self::base64UrlEncode(json_encode($payload));
        
        $signature = self::sign("$header.$payload", $key, $algorithm);
        
        return "$header.$payload.$signature";
    }
    
    /**
     * Decode a JWT token
     */
    public static function decode($token, $key, $algorithms = ['HS256']) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }
        
        list($header, $payload, $signature) = $parts;
        
        $headerData = json_decode(self::base64UrlDecode($header), true);
        
        if (!isset($headerData['alg']) || !in_array($headerData['alg'], $algorithms)) {
            throw new Exception('Invalid algorithm');
        }
        
        // Verify signature
        $expectedSignature = self::sign("$header.$payload", $key, $headerData['alg']);
        
        if (!self::constantTimeEquals($signature, $expectedSignature)) {
            throw new Exception('Invalid signature');
        }
        
        $payloadData = json_decode(self::base64UrlDecode($payload), true);
        
        // Check expiration
        if (isset($payloadData['exp']) && time() >= $payloadData['exp']) {
            throw new Exception('Token has expired');
        }
        
        // Check not before
        if (isset($payloadData['nbf']) && time() < $payloadData['nbf']) {
            throw new Exception('Token not yet valid');
        }
        
        return $payloadData;
    }
    
    /**
     * Sign a message
     */
    private static function sign($message, $key, $algorithm) {
        switch ($algorithm) {
            case 'HS256':
                $hash = hash_hmac('sha256', $message, $key, true);
                break;
            case 'HS384':
                $hash = hash_hmac('sha384', $message, $key, true);
                break;
            case 'HS512':
                $hash = hash_hmac('sha512', $message, $key, true);
                break;
            default:
                throw new Exception('Unsupported algorithm');
        }
        
        return self::base64UrlEncode($hash);
    }
    
    /**
     * Base64 URL encode
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64 URL decode
     */
    private static function base64UrlDecode($data) {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
    
    /**
     * Constant time string comparison for security
     */
    private static function constantTimeEquals($left, $right) {
        if (function_exists('hash_equals')) {
            return hash_equals($left, $right);
        }
        
        $len = min(strlen($left), strlen($right));
        $status = strlen($left) ^ strlen($right);
        
        for ($i = 0; $i < $len; $i++) {
            $status |= ord($left[$i]) ^ ord($right[$i]);
        }
        
        return $status === 0;
    }
}