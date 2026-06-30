<?php

namespace App\Core\Crud\Fields;

use JsonSerializable;

class Section implements JsonSerializable
{
    protected string $label;

    protected array $schema;

    protected ?string $description = null;

    protected ?string $icon = null;

    public function __construct(string $label, array $schema)
    {
        $this->label = $label;
        $this->schema = $schema;
    }

    public static function make(string $label, array $schema): static
    {
        return new static($label, $schema);
    }

    public function description(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function icon(string $icon): static
    {
        $this->icon = $icon;

        return $this;
    }

    public function getFields(): array
    {
        $fields = [];
        foreach ($this->schema as $item) {
            if ($item instanceof Section) {
                $fields = array_merge($fields, $item->getFields());
            } else {
                $fields[] = $item;
            }
        }

        return $fields;
    }

    public function toArray(): array
    {
        return [
            'isGroup' => true,
            'label' => $this->label,
            'description' => $this->description,
            'icon' => $this->icon,
            'schema' => $this->schema,
        ];
    }

    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
