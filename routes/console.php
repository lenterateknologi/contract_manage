<?php

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your closure based console
| commands. Each closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    // ponytail: Periodic refresh of the dashboard materialized view
    try {
        DB::statement('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_contracts');
    } catch (Throwable $e) {
        DB::statement('REFRESH MATERIALIZED VIEW mv_dashboard_contracts');
    }
})->hourly();
