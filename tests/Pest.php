<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "use()" method to suit your organizational needs.
|
*/

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->use(TestCase::class, RefreshDatabase::class)->in('Feature');
pest()->use(TestCase::class)->in('Unit');
