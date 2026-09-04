<?php

namespace App\Core\Crud\Columns;

use Illuminate\Support\Str;
use JsonSerializable;

class Column implements JsonSerializable
{
    protected string $name;

    protected string $label;

    protected string $type = 'text';

    protected bool $isSortable = false;

    protected bool $isSearchable = false;

    protected mixed $formatStateUsing = null;

    protected string $align = 'left';

    public function __construct(string $name, ?string $label = null)
    {
        $this->name = $name;
        $this->label = $label ?? Str::headline($name);
    }

    public static function make(string $name, ?string $label = null): static
    {
        return new static($name, $label);
    }

    public function sortable(bool $condition = true): static
    {
        $this->isSortable = $condition;

        return $this;
    }

    public function searchable(bool $condition = true): static
    {
        $this->isSearchable = $condition;

        return $this;
    }

    public function alignRight(): static
    {
        $this->align = 'right';

        return $this;
    }

    public function alignCenter(): static
    {
        $this->align = 'center';

        return $this;
    }

    public function align(string $align): static
    {
        $this->align = $align;

        return $this;
    }

    public function type(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function formatStateUsing(callable $callback): static
    {
        $this->formatStateUsing = $callback;

        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function isSearchable(): bool
    {
        return $this->isSearchable;
    }

    public function formatState(mixed $state, mixed $record)
    {
        if ($this->formatStateUsing) {
            return call_user_func($this->formatStateUsing, $state, $record);
        }

        return $state;
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'label' => $this->label,
            'type' => $this->type,
            'sortable' => $this->isSortable,
            'searchable' => $this->isSearchable,
            'align' => $this->align,
        ];
    }

    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
