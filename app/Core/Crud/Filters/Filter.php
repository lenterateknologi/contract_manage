<?php

namespace App\Core\Crud\Filters;

class Filter
{
    protected string $name;

    protected string $label;

    protected string $type = 'choice';

    protected array $options = [];

    public function __construct(string $name, string $label)
    {
        $this->name = $name;
        $this->label = $label;
    }

    public static function make(string $name, string $label): static
    {
        return new static($name, $label);
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

    public function options(array|callable $options): static
    {
        if (is_callable($options)) {
            $this->options = call_user_func($options);
        } else {
            $this->options = $options;
        }

        return $this;
    }

    public function toArray(): array
    {
        $formattedOptions = [];
        foreach ($this->options as $value => $label) {
            $formattedOptions[] = [
                'label' => $label,
                'value' => (string) $value,
            ];
        }

        return [
            'key' => $this->name,
            'label' => $this->label,
            'type' => $this->type,
            'options' => $formattedOptions,
        ];
    }
}
