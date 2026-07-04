<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('m_division', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->nullable();
            $table->uuid('id_portal_master')->nullable();
            $table->string('name');
            $table->uuid('department_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Insert the records
        DB::statement('
            INSERT INTO m_division (id,code,id_portal_master,"name",department_id,is_active,created_at,created_by,updated_at,updated_by) VALUES
            (\'f8e965d2-c66d-11f0-8472-598095a9f5b1\',\'dws\',NULL,\'downstream\',NULL,true,\'2025-11-21 07:06:47.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 09:48:25.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\'),
            (\'8bdacd62-cbfb-11f0-91e5-b5cb5c56ed2f\',\'hrd\',NULL,\'Human Resources\',NULL,true,\'2025-11-28 08:42:49.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 09:48:34.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\'),
            (\'dbb74262-0561-11f1-89b3-08002791ab91\',\'akt\',NULL,\'Accounting, Finance & Tax\',NULL,true,\'2026-02-09 09:48:48.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 09:50:04.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\'),
            (\'8c4b398a-0562-11f1-91d7-08002791ab91\',\'mkt\',NULL,\'Marketing\',NULL,true,\'2026-02-09 09:53:44.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 09:53:44.000\',NULL),
            (\'b119f4a4-0562-11f1-a33f-08002791ab91\',\'ict\',NULL,\'ICT\',NULL,true,\'2026-02-09 09:54:46.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 09:54:46.000\',NULL),
            (\'d3fde3f4-0562-11f1-ace3-08002791ab91\',\'gaf\',NULL,\'General Affair\',NULL,true,\'2026-02-09 09:55:44.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 09:55:44.000\',NULL),
            (\'1daf242c-0563-11f1-9a89-08002791ab91\',\'pcr\',NULL,\'Procurement\',NULL,true,\'2026-02-09 09:57:48.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 09:57:48.000\',NULL),
            (\'4882b5c4-0563-11f1-900a-08002791ab91\',\'cwp\',NULL,\'Central Workshop\',NULL,true,\'2026-02-09 09:59:00.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 09:59:00.000\',NULL),
            (\'f43cabe0-0563-11f1-b7eb-08002791ab91\',\'cve\',NULL,\'Civil Engineering\',NULL,true,\'2026-02-09 10:03:48.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 10:03:48.000\',NULL),
            (\'0b0fbe8e-0564-11f1-8111-08002791ab91\',\'lga\',NULL,\'Legal\',NULL,true,\'2026-02-09 10:04:26.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 10:04:26.000\',NULL)
        ');

        DB::statement('
            INSERT INTO m_division (id,code,id_portal_master,"name",department_id,is_active,created_at,created_by,updated_at,updated_by) VALUES
            (\'536104ae-0564-11f1-a781-08002791ab91\',\'mil\',NULL,\'Mil Produksi\',NULL,true,\'2026-02-09 10:06:27.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 10:06:53.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\'),
            (\'769d20ec-0564-11f1-8c7f-08002791ab91\',\'qca\',NULL,\'Quality Assurance\',NULL,true,\'2026-02-09 10:07:27.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 10:07:38.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\'),
            (\'bee37ebe-0564-11f1-b41f-08002791ab91\',\'scu\',NULL,\'Security\',NULL,true,\'2026-02-09 10:09:28.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-09 10:09:28.000\',NULL),
            (\'34a83fe2-065d-11f1-926c-08002791ab91\',\'spl\',NULL,\'Supply Chain\',NULL,true,\'2026-02-10 15:48:01.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-10 15:48:01.000\',NULL),
            (\'b2c7d608-065d-11f1-ac3a-08002791ab91\',\'csr\',NULL,\'Corporate Social Responsibility\',NULL,true,\'2026-02-10 15:51:32.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-10 15:51:32.000\',NULL),
            (\'b80dda7c-065d-11f1-8659-08002791ab91\',\'ehs\',NULL,\'EHS\',NULL,true,\'2026-02-10 15:51:41.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-10 15:51:41.000\',NULL),
            (\'e9d9af04-065d-11f1-b21b-08002791ab91\',\'iau\',NULL,\'Internal Auditor\',NULL,true,\'2026-02-10 15:53:05.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-10 15:53:05.000\',NULL),
            (\'8e334056-065e-11f1-927f-08002791ab91\',\'cor\',NULL,\'Corporate Communication\',NULL,true,\'2026-02-10 15:57:40.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-10 15:57:40.000\',NULL),
            (\'977a2fc6-065e-11f1-9f3b-08002791ab91\',\'str\',NULL,\'Secretary\',NULL,true,\'2026-02-10 15:57:56.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-10 15:57:56.000\',NULL),
            (\'3c21482e-06ec-11f1-ac26-08002791ab91\',\'gvr\',NULL,\'Govt. Relation\',NULL,true,\'2026-02-11 08:51:51.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-11 08:51:51.000\',NULL)
        ');

        DB::statement('
            INSERT INTO m_division (id,code,id_portal_master,"name",department_id,is_active,created_at,created_by,updated_at,updated_by) VALUES
            (\'c724ed08-06ed-11f1-b27c-08002791ab91\',\'bpr\',NULL,\'Business Process\',NULL,true,\'2026-02-11 09:02:54.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-11 09:02:54.000\',NULL),
            (\'5cf0eb74-06ef-11f1-b0b4-08002791ab91\',\'sts\',NULL,\'Sustainability\',NULL,true,\'2026-02-11 09:14:15.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-11 09:14:15.000\',NULL),
            (\'d58e6d54-06ef-11f1-a43b-08002791ab91\',\'rnd\',NULL,\'Research and Development\',NULL,true,\'2026-02-11 09:17:37.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-11 09:17:37.000\',NULL),
            (\'bc48a00c-06f0-11f1-8ee1-08002791ab91\',\'kop\',NULL,\'Koperasi\',NULL,true,\'2026-02-11 09:24:04.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-11 09:24:04.000\',NULL),
            (\'a34d3090-c66d-11f0-9ecd-dd44852b76cd\',\'agt\',NULL,\'Operasional Traksi\',NULL,false,\'2025-11-21 07:04:24.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-11 13:42:29.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\'),
            (\'7b43e0f8-c66d-11f0-930c-1926e4bba9ed\',\'agk\',NULL,\'Agronomi\',NULL,true,\'2025-11-21 07:03:17.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\',\'2026-02-11 13:42:42.000\',\'5756c07c-a388-4d89-8d87-a64814b98800\')
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_division');
    }
};
