<?php

namespace App\Core\Crud\Fields;

use Illuminate\Support\Str;
use JsonSerializable;

class Field implements JsonSerializable
{
    protected string $name;

    protected string $label;

    protected string $type = 'text';

    protected bool $isRequired = false;

    protected array $rules = [];

    protected mixed $defaultValue = null;

    protected int $columnSpan = 1;

    protected ?string $placeholder = null;

    protected ?string $icon = null;

    public function __construct(string $name, ?string $label = null)
    {
        $this->name = $name;
        $this->label = $label ?? Str::headline($name);
    }

    public static function make(string $name, ?string $label = null): static
    {
        return new static($name, $label);
    }

    public function required(bool $condition = true): static
    {
        $this->isRequired = $condition;
        if ($condition) {
            $this->rules[] = 'required';
        }

        return $this;
    }

    public function rules(array $rules): static
    {
        $this->rules = array_merge($this->rules, $rules);

        return $this;
    }

    public function default(mixed $value): static
    {
        $this->defaultValue = $value;

        return $this;
    }

    public function columnSpan(int $span): static
    {
        $this->columnSpan = $span;

        return $this;
    }

    public function placeholder(string $placeholder): static
    {
        $this->placeholder = $placeholder;

        return $this;
    }

    public function icon(string $icon): static
    {
        $this->icon = $icon;

        return $this;
    }

    public function type(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getRules(): array
    {
        return $this->rules;
    }

    public function getPlaceholder(): ?string
    {
        if ($this->placeholder !== null) {
            return $this->placeholder;
        }

        if (in_array($this->type, ['text', 'textarea'])) {
            return 'Masukkan '.strtolower($this->label).'...';
        }

        if ($this->type === 'select') {
            return 'Pilih '.strtolower($this->label).'...';
        }

        return null;
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'label' => $this->label,
            'type' => $this->type,
            'required' => $this->isRequired,
            'defaultValue' => $this->defaultValue,
            'columnSpan' => $this->columnSpan,
            'placeholder' => $this->getPlaceholder(),
            'icon' => $this->icon,
        ];
    }

    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
