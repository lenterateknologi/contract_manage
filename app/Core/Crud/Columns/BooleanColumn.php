<?php

namespace App\Core\Crud\Columns;

class BooleanColumn extends Column
{
    protected string $type = 'boolean';

    protected bool $isSortable = true;

    protected string $align = 'right';
}
