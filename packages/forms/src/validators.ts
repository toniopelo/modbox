import { FormItemType, FormItem, Responses } from './types'

type FormItemTypeWithoutGrid = Exclude<FormItemType, FormItemType.Grid>

const VALIDATORS: {
  [type in FormItemTypeWithoutGrid]: (
    item: FormItem<type>,
    response: Responses<type>[string],
  ) => boolean
} = {
  [FormItemType.ShortText]: (i, r) =>
    !!r &&
    r.length >= (i.minLength ?? 1) &&
    r.length <= (i.maxLength ?? Infinity),
  [FormItemType.Number]: (i, r) =>
    !!r && r >= (i.minValue ?? -Infinity) && r <= (i.maxValue ?? Infinity),
  [FormItemType.Collection]: (i, r) =>
    (i.minItems === 0 && r === null) ||
    (r !== null &&
      r.length >= i.minItems &&
      r.length <= i.maxItems &&
      i.template.every((iTemplate) => {
        r.every((rRow) => validateItem(iTemplate, rRow[iTemplate.id]))
      })),
  [FormItemType.Checkbox]: () => true,
  [FormItemType.Select]: (i, r) => !!r,
  [FormItemType.DropdownSelect]: (i, r) => !!r,
  [FormItemType.Heading]: () => true,
  [FormItemType.Custom]: () => true,
}

export const validateItem = <T extends FormItemTypeWithoutGrid>(
  item: FormItem<T>,
  response: Responses<T>[string],
) => {
  const validate = VALIDATORS[item.type as FormItemTypeWithoutGrid] as (
    item: FormItem<T>,
    response: Responses[string],
  ) => boolean
  return validate(item, response)
}

export const validateItems = (
  items: FormItem[],
  responses: Responses,
): boolean => {
  return items.every((i) => {
    if (i.type === FormItemType.Grid) {
      return validateItems(i.value, responses)
    }

    const response = responses[i.id]
    return validateItem(i, response)
  })
}
