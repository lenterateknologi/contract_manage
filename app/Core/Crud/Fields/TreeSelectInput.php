<?php

namespace App\Core\Crud\Fields;

class TreeSelectInput extends Field
{
    protected string $type = 'tree_select';

    protected array $options = [];

    protected bool $multiple = false;

    protected bool $inline = false;

    protected bool $disableParentSelection = false;

    protected bool $allowClear = true;

    protected ?string $rootOptionLabel = null;

    public function options(array|callable $options): static
    {
        if (is_callable($options)) {
            $this->options = call_user_func($options);
        } else {
            $this->options = $options;
        }

        return $this;
    }

    public function multiple(bool $multiple = true): static
    {
        $this->multiple = $multiple;

        return $this;
    }

    public function inline(bool $inline = true): static
    {
        $this->inline = $inline;

        return $this;
    }

    public function disableParentSelection(bool $disable = true): static
    {
        $this->disableParentSelection = $disable;

        return $this;
    }

    public function allowClear(bool $allow = true): static
    {
        $this->allowClear = $allow;

        return $this;
    }

    public function rootOptionLabel(?string $label): static
    {
        $this->rootOptionLabel = $label;

        return $this;
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'options' => $this->options,
            'multiple' => $this->multiple,
            'inline' => $this->inline,
            'disableParentSelection' => $this->disableParentSelection,
            'allowClear' => $this->allowClear,
            'rootOptionLabel' => $this->rootOptionLabel,
        ]);
    }
}
