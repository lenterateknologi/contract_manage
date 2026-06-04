<?php

namespace App\Enums;

enum TransactionType: string
{
    case NewAgreement = 'Perjanjian Baru';
    case Amendment = 'Amandemen';
    case Renewal = 'Perpanjangan';
    case Addendum = 'Addendum';

    public function label(): string
    {
        return $this->value;
    }
}
