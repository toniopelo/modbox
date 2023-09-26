import React from 'react'
import { Fragment } from 'react'

import FormItemCheckbox from '../FormItemCheckbox'
import FormItemCollection from '../FormItemCollection'
import FormItemDropdownSelect from '../FormItemDropdownSelect'
import FormItemNumber from '../FormItemNumber'
import FormItemSelect from '../FormItemSelect'
import FormItemShortText from '../FormItemShortText'
import {
  FormItem,
  FormItemType,
  FormRenderer,
  FormValue,
  FormItemSizeNumber,
  FormItemSizeBreakpoint,
} from '../../types'
import { MAX_SIZE_RESOLUTION } from '../..'

const GRID_SIZES_CLASSNAMES: {
  [k in FormItemSizeNumber]: string
} = {
  [1]: 'grid-cols-1 items-end',
  [2]: 'grid-cols-2 items-end',
  [3]: 'grid-cols-3 items-end',
  [4]: 'grid-cols-4 items-end',
  [5]: 'grid-cols-5 items-end',
  [6]: 'grid-cols-6 items-end',
  [7]: 'grid-cols-7 items-end',
  [8]: 'grid-cols-8 items-end',
  [9]: 'grid-cols-9 items-end',
  [10]: 'grid-cols-10 items-end',
  [11]: 'grid-cols-11 items-end',
  [12]: 'grid-cols-12 items-end',
}

const ITEMS_SIZES_CLASSNAMES: {
  [k in FormItemSizeBreakpoint]: {
    [k in FormItemSizeNumber]: string
  }
} = {
  default: {
    [1]: 'col-span-1',
    [2]: 'col-span-2',
    [3]: 'col-span-3',
    [4]: 'col-span-4',
    [5]: 'col-span-5',
    [6]: 'col-span-6',
    [7]: 'col-span-7',
    [8]: 'col-span-8',
    [9]: 'col-span-9',
    [10]: 'col-span-10',
    [11]: 'col-span-11',
    [12]: 'col-span-12',
  },
  sm: {
    [1]: 'sm:col-span-1',
    [2]: 'sm:col-span-2',
    [3]: 'sm:col-span-3',
    [4]: 'sm:col-span-4',
    [5]: 'sm:col-span-5',
    [6]: 'sm:col-span-6',
    [7]: 'sm:col-span-7',
    [8]: 'sm:col-span-8',
    [9]: 'sm:col-span-9',
    [10]: 'sm:col-span-10',
    [11]: 'sm:col-span-11',
    [12]: 'sm:col-span-12',
  },
  md: {
    [1]: 'md:col-span-1',
    [2]: 'md:col-span-2',
    [3]: 'md:col-span-3',
    [4]: 'md:col-span-4',
    [5]: 'md:col-span-5',
    [6]: 'md:col-span-6',
    [7]: 'md:col-span-7',
    [8]: 'md:col-span-8',
    [9]: 'md:col-span-9',
    [10]: 'md:col-span-10',
    [11]: 'md:col-span-11',
    [12]: 'md:col-span-12',
  },
  lg: {
    [1]: 'lg:col-span-1',
    [2]: 'lg:col-span-2',
    [3]: 'lg:col-span-3',
    [4]: 'lg:col-span-4',
    [5]: 'lg:col-span-5',
    [6]: 'lg:col-span-6',
    [7]: 'lg:col-span-7',
    [8]: 'lg:col-span-8',
    [9]: 'lg:col-span-9',
    [10]: 'lg:col-span-10',
    [11]: 'lg:col-span-11',
    [12]: 'lg:col-span-12',
  },
  xl: {
    [1]: 'xl:col-span-1',
    [2]: 'xl:col-span-2',
    [3]: 'xl:col-span-3',
    [4]: 'xl:col-span-4',
    [5]: 'xl:col-span-5',
    [6]: 'xl:col-span-6',
    [7]: 'xl:col-span-7',
    [8]: 'xl:col-span-8',
    [9]: 'xl:col-span-9',
    [10]: 'xl:col-span-10',
    [11]: 'xl:col-span-11',
    [12]: 'xl:col-span-12',
  },
}

export const FormLayout: FormRenderer = ({
  items,
  values,
  onChange,
  className = '',
  children: customFormItemRenderer,
}) => {
  const gridSizeClassName = GRID_SIZES_CLASSNAMES[MAX_SIZE_RESOLUTION]

  return (
    <div className={`grid ${gridSizeClassName} gap-3 ${className}`}>
      {items.map((item, idx) => {
        const sizeClassName = getItemSizeClassName(item)

        const overlapLabel = item.layout?.overlapLabel ?? false
        const itemClassName = item.layout?.className ?? ''

        if (item.type === FormItemType.Custom) {
          const customRenderer = item.rederer || customFormItemRenderer
          if (!customRenderer) {
            throw new Error(
              'FormItem.Custom encountered but no render function was provided',
            )
          }

          return (
            <div
              key={`custom-item-${idx}`}
              className={`${sizeClassName} ${itemClassName}`}
            >
              {customRenderer(item)}
            </div>
          )
        }

        return (
          <Fragment key={`item-${idx}`}>
            {item.type === FormItemType.Select && (
              <FormItemSelect
                item={item}
                value={values[item.id] as FormValue<FormItemType.Select>}
                onSelect={(value) => onChange(item, value)}
                className={`${sizeClassName} ${itemClassName}`}
              />
            )}
            {item.type === FormItemType.DropdownSelect && (
              <FormItemDropdownSelect
                item={item}
                value={
                  values[item.id] as FormValue<FormItemType.DropdownSelect>
                }
                onSelect={(value) => onChange(item, value)}
                className={`${sizeClassName} ${itemClassName}`}
                overlapLabel={overlapLabel}
              />
            )}
            {item.type === FormItemType.ShortText && (
              <FormItemShortText
                item={item}
                value={values[item.id] as FormValue<FormItemType.ShortText>}
                onChange={(value) => onChange(item, value)}
                className={`${sizeClassName} ${itemClassName}`}
                overlapLabel={overlapLabel}
              />
            )}
            {item.type === FormItemType.Number && (
              <FormItemNumber
                item={item}
                value={values[item.id] as FormValue<FormItemType.Number>}
                onChange={(value) => onChange(item, value)}
                className={`${sizeClassName} ${itemClassName}`}
                overlapLabel={overlapLabel}
              />
            )}
            {item.type === FormItemType.Checkbox && (
              <FormItemCheckbox
                item={item}
                value={values[item.id] as FormValue<FormItemType.Checkbox>}
                onChange={(value) =>
                  onChange<FormItemType.Checkbox>(item, value)
                }
                className={`${sizeClassName} ${itemClassName}`}
              />
            )}
            {item.type === FormItemType.Collection && (
              <FormItemCollection
                item={item}
                value={values[item.id] as FormValue<FormItemType.Collection>}
                onChange={(value) => onChange(item, value)}
                rederer={FormLayout}
                className={`${sizeClassName} ${itemClassName}`}
                customFormItemRenderer={customFormItemRenderer}
              />
            )}
            {item.type === FormItemType.Grid && (
              <FormLayout
                items={item.grid}
                values={values}
                onChange={onChange}
                className={`${sizeClassName} ${itemClassName}`}
              >
                {customFormItemRenderer}
              </FormLayout>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

const getItemSizeClassName = ({ layout }: FormItem) => {
  const sizeOption = layout?.size ?? MAX_SIZE_RESOLUTION
  const isDefault = typeof sizeOption === 'number'

  const size = isDefault
    ? { default: sizeOption }
    : { default: MAX_SIZE_RESOLUTION as FormItemSizeNumber, ...sizeOption }

  return Object.entries(size).reduce(
    (className, [breakpoint, size]) =>
      `${className} ${
        ITEMS_SIZES_CLASSNAMES[breakpoint as FormItemSizeBreakpoint][size]
      }`,
    '',
  )
}
