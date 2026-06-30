<?php

namespace App\Core\Crud;

use App\Core\Crud\Columns\Column;
use App\Core\Crud\Fields\Field;
use App\Core\Crud\Filters\Filter;

abstract class Resource
{
    /**
     * The Eloquent Model string.
     */
    public static string $model;

    /**
     * The relationships to eager load.
     */
    public static array $with = [];

    /**
     * The title of the resource.
     */
    public static ?string $title = null;

    /**
     * The number of columns for the form layout.
     */
    public static int $formColumns = 1;

    /**
     * The slug of the resource for URL routing.
     */
    public static ?string $slug = null;

    /**
     * The Excel Export class name.
     */
    public static ?string $exportClass = null;

    /**
     * The Excel Import class name.
     */
    public static ?string $importClass = null;

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
        return static::$slug ?? strtolower(class_basename(static::$model)).'s';
    }

    /**
     * Define the table columns.
     *
     * @return Column[]
     */
    public static function table(): array
    {
        return [];
    }

    /**
     * Define the form fields.
     *
     * @return Field[]
     */
    public static function form(): array
    {
        return [];
    }

    /**
     * Define the resource filters.
     *
     * @return Filter[]
     */
    public static function filters(): array
    {
        return [];
    }
}
