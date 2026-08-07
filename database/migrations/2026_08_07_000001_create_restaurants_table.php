<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();

            // Branding
            $table->string('logo')->nullable();
            $table->string('primary_color')->default('#e85d04');
            $table->string('secondary_color')->default('#f48c06');
            $table->string('accent_color')->default('#ffb703');
            $table->string('font_family')->default('Inter');

            // Business
            $table->string('currency')->default('ETB');
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->string('timezone')->default('Africa/Addis_Ababa');
            $table->text('description')->nullable();

            // Owner contact
            $table->string('owner_email')->nullable();
            $table->string('owner_phone')->nullable();

            // SaaS
            $table->string('plan')->default('starter'); // starter, pro, enterprise
            $table->timestamp('plan_expires_at')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurants');
    }
};
