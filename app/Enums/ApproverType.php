<?php

namespace App\Enums;

enum ApproverType: string
{
    case Role = 'role';
    case User = 'user';
    case Department = 'department';
    case Hierarchy = 'hierarchy';
    case Pic = 'pic';

    public function label(): string
    {
        return match ($this) {
            self::Role => 'Berdasarkan Role',
            self::User => 'Berdasarkan User',
            self::Department => 'Berdasarkan Departemen',
            self::Hierarchy => 'Berdasarkan Hierarki',
            self::Pic => 'PIC yang Ditugaskan',
        };
    }
}
