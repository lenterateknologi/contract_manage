<?php
require 'vendor/autoload.php';
use Spatie\Browsershot\Browsershot;

try {
    echo "Testing Browsershot with Chrome path...\n";
    Browsershot::html('<h1>Hello World from Chrome</h1>')
        ->setNodeBinary('/opt/homebrew/bin/node')
        ->setNpmBinary('/opt/homebrew/bin/npm')
        ->setChromePath('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
        ->noSandbox()
        ->save('scratch/test.pdf');
    echo "Done! Check scratch/test.pdf\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
