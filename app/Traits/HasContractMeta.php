<?php

namespace App\Traits;

use App\Models\ContractMeta;

trait HasContractMeta
{
    /**
     * Temporary storage for meta attributes during save.
     */
    public array $metaToSave = [];

    /**
     * Columns that are considered metadata.
     */
    protected array $metaColumns = [
        'kop_topik', 'kop_sub_topik', 'p1_entity', 'p1_address', 'p1_contact_person',
        'p1_email', 'p1_phone', 'p2_entity', 'p2_address', 'p2_contact_person',
        'p2_email', 'p2_phone', 'f1_name', 'f1_start_date', 'f1_end_date',
        'f2_price', 'f2_payment_terms', 'f3_penalties', 'f3_insurance',
        'f4_special_conditions', 'f4_guarantees',
    ];

    /**
     * Boot the trait.
     */
    protected static function bootHasContractMeta()
    {
        static::saved(function ($model) {
            $metaData = [];
            foreach ($model->metaColumns as $col) {
                if (array_key_exists($col, $model->attributes)) {
                    $metaData[$col] = $model->attributes[$col];
                    // Do not unset so that next saves don't erase it if still needed?
                    // Actually, if it's in attributes, it might have been saved to the DB if we didn't remove it before insert.
                    // To prevent insert into DB, we should actually hook into 'saving'.
                }
            }

            if (! empty($metaData)) {
                $meta = $model->meta()->first() ?: new ContractMeta(['contract_id' => $model->id]);
                $meta->fill($metaData);
                $meta->save();
            }
        });

        static::saving(function ($model) {
            // Remove meta columns from attributes so they don't get saved to t_contracts
            foreach ($model->metaColumns as $col) {
                if (array_key_exists($col, $model->attributes)) {
                    // Temporarily store them in a custom array if we want to save them in 'saved'
                    // but we can just leave them in $model->attributes and remove them from $model->getAttributes()
                    // Wait, Laravel uses $model->getAttributes() to build the query.
                    // Actually, if we unset them here, they won't be available in 'saved'.
                    $model->metaToSave[$col] = $model->attributes[$col];
                    unset($model->attributes[$col]);
                }
            }
        });

        static::saved(function ($model) {
            if (isset($model->metaToSave) && ! empty($model->metaToSave)) {
                $meta = $model->meta()->first() ?: new ContractMeta(['contract_id' => $model->id]);
                $meta->fill($model->metaToSave);
                $meta->save();

                // Put them back in attributes for consistency in memory
                foreach ($model->metaToSave as $k => $v) {
                    $model->attributes[$k] = $v;
                }
                $model->metaToSave = [];
            }
        });
    }

    public function getAttribute($key)
    {
        if (in_array($key, $this->metaColumns)) {
            if (array_key_exists($key, $this->attributes)) {
                return $this->attributes[$key];
            }
            if ($this->relationLoaded('meta') && $this->meta) {
                return $this->meta->$key;
            }

            return null;
        }

        return parent::getAttribute($key);
    }

    public function setAttribute($key, $value)
    {
        if (in_array($key, $this->metaColumns)) {
            $this->attributes[$key] = $value;

            return $this;
        }

        return parent::setAttribute($key, $value);
    }

    public function toArray()
    {
        $array = parent::toArray();
        if ($this->relationLoaded('meta') && $this->meta) {
            foreach ($this->metaColumns as $col) {
                if ($this->meta->$col !== null && ! array_key_exists($col, $array)) {
                    $array[$col] = $this->meta->$col;
                }
            }
        }

        return $array;
    }
}
