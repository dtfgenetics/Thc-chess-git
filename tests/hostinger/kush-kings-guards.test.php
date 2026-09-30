<?php
declare(strict_types=1);

function kkc_error(string $message, int $status = 400): void
{
    throw new RuntimeException($status . ':' . $message);
}

require __DIR__ . '/../../public-hostinger/kush-kings-chess/api/guards.php';

function assertSameValue(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        fwrite(STDERR, $message . PHP_EOL);
        fwrite(STDERR, 'Expected: ' . var_export($expected, true) . PHP_EOL);
        fwrite(STDERR, 'Actual:   ' . var_export($actual, true) . PHP_EOL);
        exit(1);
    }
}

function capturedGuardError(callable $callback): ?string
{
    try {
        $callback();
    } catch (RuntimeException $error) {
        return $error->getMessage();
    }
    return null;
}

$valid = str_repeat('a', 48);
assertSameValue($valid, kkc_optional_token($valid), 'Valid local player tokens must be accepted.');
assertSameValue(null, kkc_optional_token('short'), 'Short tokens must be rejected.');
assertSameValue(null, kkc_optional_token(['not', 'a', 'token']), 'Array-valued tokens must fail safely.');
assertSameValue(null, kkc_optional_token('invalid token with spaces 1234567890'), 'Tokens with invalid characters must be rejected.');
assertSameValue('42', kkc_scalar_string(42), 'Numeric scalar values may be normalized to text.');
assertSameValue(null, kkc_nullable_scalar_string(null), 'Nullable scalar helper must preserve null.');
assertSameValue(
    '400:Player name must be text.',
    capturedGuardError(fn() => kkc_scalar_string(['bad'], 'Player name must be text.')),
    'Structured values must be rejected instead of cast to Array.'
);
assertSameValue(
    '401:A valid local player token is required.',
    capturedGuardError(fn() => kkc_required_player_token(['token' => ['bad']])),
    'Structured player tokens must return a clean authentication error.'
);

unset($_SERVER['HTTP_X_KKC_PLAYER_TOKEN']);
assertSameValue($valid, kkc_request_player_token(['token' => $valid]), 'Legacy query tokens remain temporarily compatible.');

$headerToken = str_repeat('b', 48);
$_SERVER['HTTP_X_KKC_PLAYER_TOKEN'] = $headerToken;
assertSameValue($headerToken, kkc_request_player_token(['token' => $valid]), 'Polling header must take precedence over the legacy query token.');
$_SERVER['HTTP_X_KKC_PLAYER_TOKEN'] = 'bad header';
assertSameValue(null, kkc_request_player_token(['token' => $valid]), 'A malformed explicit polling header must not fall back to a query token.');
unset($_SERVER['HTTP_X_KKC_PLAYER_TOKEN']);

$_SERVER['REQUEST_METHOD'] = 'POST';
kkc_require_method('POST');

$_SERVER['REQUEST_METHOD'] = 'GET';
assertSameValue(
    '405:Method not allowed.',
    capturedGuardError(fn() => kkc_require_method('POST')),
    'Wrong HTTP methods must be rejected with 405.'
);

echo "Kush Kings guard tests passed.\n";
