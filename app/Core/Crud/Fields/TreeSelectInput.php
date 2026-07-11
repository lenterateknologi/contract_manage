<?php

namespace App\Core\Crud\Fields;

class TreeSelectInput extends Field
{
    protected string $type = 'tree_select';

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
