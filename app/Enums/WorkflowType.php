<?php

namespace App\Enums;

enum WorkflowType: string
{
    case MAIN = 'main';
    case SUB_WORKFLOW = 'sub_workflow';
    case STANDALONE = 'standalone';

    public function label(): string
    {
        return match ($this) {
            self::MAIN => 'Workflow Utama (Master)',
            self::SUB_WORKFLOW => 'Workflow Bagian (Sub-Workflow)',
            self::STANDALONE => 'Workflow Standar (Tunggal)',
        };
    }

    public function badgeColor(): string
    {
        return match ($this) {
            self::MAIN => 'blue',
            self::SUB_WORKFLOW => 'purple',
            self::STANDALONE => 'slate',
        };
    }

    public static function options(): array
    {
        return [
            [
                'value' => self::MAIN->value,
                'label' => self::MAIN->label(),
                'description' => 'Berfungsi sebagai pengendali utama (master/orchestrator) yang mengoordinasikan sub-workflow.',
            ],
            [
                'value' => self::SUB_WORKFLOW->value,
                'label' => self::SUB_WORKFLOW->label(),
                'description' => 'Berfungsi sebagai modul workflow bagian yang dipanggil atau terhubung ke master/sub-workflow lain.',
            ],
            [
                'value' => self::STANDALONE->value,
                'label' => self::STANDALONE->label(),
                'description' => 'Workflow mandiri yang berjalan dari awal hingga akhir dalam satu alur utuh.',
            ],
        ];
    }
}
