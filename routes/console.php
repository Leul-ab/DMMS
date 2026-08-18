<?php

use App\Console\Commands\NotifyMembersOfDiscounts;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Notify eligible members about member-only discounts as they become active.
Schedule::command(NotifyMembersOfDiscounts::class)->everyMinute();
