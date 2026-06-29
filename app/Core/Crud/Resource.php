<?php

namespace App\Core\Crud;

abstract class Resource
{
    /**
     * The Eloquent Model string.
     */
    public static string $model;

    /**
     * The title of the resource.
     */
    public static ?string $title = null;

    /**
     * The slug of the resource for URL routing.
     */
    public static ?string $slug = null;

    /**
     * Get the resource title.
     */
    public static function getTitle(): string
    {
        return static::$title ?? class_basename(static::$model);
    }

    /**
     * Get the resource slug.
     */
    public static function getSlug(): string
    {
        return static::$slug ?? strtolower(class_basename(static::$model)) . 's';
    }

    /**
     * Define the table columns.
     * @return \App\Core\Crud\Columns\Column[]
     */
    public static function table(): array
    {
        return [];
    }

    /**
     * Define the form fields.
     * @return \App\Core\Crud\Fields\Field[]
     */
    public static function form(): array
    {
        return [];
    }
}
