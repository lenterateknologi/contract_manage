<?php

namespace App\Core\Crud\Fields;

class CheckboxListInput extends Field
{
    protected string $type = 'checkbox_list';

    protected array $options = [];

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
        return array_merge(parent::toArray(), [
            'options' => $this->options,
        ]);
    }
}
