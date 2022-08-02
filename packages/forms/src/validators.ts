import { FormItemType, FormItem } from './types'

const VALIDATORS: {
  [type in FormItemType]: (item: FormItem<type>) => boolean
} = {
  [FormItemType.ShortText]: (i) =>
    !!i.value &&
    i.value.length >= (i.minLength ?? 1) &&
    i.value.length <= (i.maxLength ?? Infinity),
  [FormItemType.Number]: (i) =>
    i.value >= (i.minValue ?? -Infinity) && i.value <= (i.maxValue ?? Infinity),
  [FormItemType.Collection]: (i) =>
    (i.minItems === 0 && i.value === null) ||
    (i.value !== null &&
      i.value.length >= i.minItems &&
      i.value.length <= i.maxItems &&
      i.value.every((c) => c.every((iNested) => validateItem(iNested)))),
  [FormItemType.Checkbox]: () => true,
  [FormItemType.Select]: (i) => !!i.value,
  [FormItemType.DropdownSelect]: (i) => !!i.value,
  [FormItemType.Heading]: () => true,
  [FormItemType.Custom]: () => true,
  [FormItemType.Grid]: (i) => i.value.every(validateItem),
}

export const validateItem = (item: FormItem) => {
  const validate = VALIDATORS[item.type] as (item: FormItem) => boolean
  return validate(item)
}
