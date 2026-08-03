<?php

namespace App\Core\Crud\Fields;

class SelectInput extends Field
{
    protected string $type = 'select';

    protected array $options = [];

    protected bool $multiple = false;

    protected bool $searchable = false;

    public function options(array|callable $options): static
    {
        if (is_callable($options)) {
            $this->options = call_user_func($options);
        } else {
            $this->options = $options;
        }

        return $this;
    }

    public function searchable(bool $searchable = true): static
    {
        $this->searchable = $searchable;

        return $this;
    }

    public function multiple(bool $multiple = true): static
    {
        $this->multiple = $multiple;

        return $this;
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'options' => $this->options,
            'multiple' => $this->multiple,
            'searchable' => $this->searchable,
        ]);
    }
}
