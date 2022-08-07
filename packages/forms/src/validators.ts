import { FormItemType, FormItem, FormValues, FormItemWithValue } from './types'
import { itemHasContent } from './utils'

const VALIDATORS: {
  [type in FormItemWithValue]: (
    item: FormItem<type>,
    value: FormValues<type>[string],
  ) => boolean
} = {
  [FormItemType.ShortText]: (i, v) =>
    (!v && !!i.optional) ||
    (!!v &&
      v.length >= (i.minLength ?? 1) &&
      v.length <= (i.maxLength ?? Infinity)),
  [FormItemType.Number]: (i, v) =>
    (v === undefined && !!i.optional) ||
    (v !== undefined &&
      !isNaN(v) &&
      v >= (i.minValue ?? -Infinity) &&
      v <= (i.maxValue ?? Infinity)),
  [FormItemType.Collection]: (i, v) => {
    return (
      (i.minItems === 0 && (!v || v.length === 0)) ||
      (!!v &&
        v.length >= i.minItems &&
        v.length <= i.maxItems &&
        v.every((vRow) =>
          i.template.every((iTemplate) =>
            itemHasContent(iTemplate)
              ? validateItem(iTemplate, vRow[iTemplate.id])
              : true,
          ),
        ))
    )
  },
  [FormItemType.Checkbox]: () => true,
  [FormItemType.Select]: (i, v) => (v === undefined && !!i.optional) || !!v,
  [FormItemType.DropdownSelect]: (i, v) => !!v,
}

export const validateItem = <T extends FormItemWithValue>(
  item: FormItem<T>,
  value: FormValues<T>[string],
) => {
  const validate = VALIDATORS[item.type as T] as (
    item: FormItem<T>,
    value: FormValues[string],
  ) => boolean
  return validate(item, value)
}

export const validateItems = (
  items: FormItem[],
  values: FormValues,
): boolean => {
  return items.every((i) => {
    if (i.type === FormItemType.Grid) {
      return validateItems(i.grid, values)
    }

    const value = values[i.id]
    return itemHasContent(i) ? validateItem(i, value) : true
  })
}
