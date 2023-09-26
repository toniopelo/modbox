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

const SIZES_CLASSNAMES: {
  [k in FormItemSizeBreakpoint]: {
    [k in FormItemSizeNumber]: { grid: string; item: string }
  }
} = {
  sm: {
    [1]: { grid: 'grid-cols-1', item: 'sm:col-span-1' },
    [2]: { grid: 'grid-cols-2', item: 'sm:col-span-2' },
    [3]: { grid: 'grid-cols-3', item: 'sm:col-span-3' },
    [4]: { grid: 'grid-cols-4', item: 'sm:col-span-4' },
    [5]: { grid: 'grid-cols-5', item: 'sm:col-span-5' },
    [6]: { grid: 'grid-cols-6', item: 'sm:col-span-6' },
    [7]: { grid: 'grid-cols-7', item: 'sm:col-span-7' },
    [8]: { grid: 'grid-cols-8', item: 'sm:col-span-8' },
    [9]: { grid: 'grid-cols-9', item: 'sm:col-span-9' },
    [10]: { grid: 'grid-cols-10', item: 'sm:col-span-10' },
    [11]: { grid: 'grid-cols-11', item: 'sm:col-span-11' },
    [12]: { grid: 'grid-cols-12', item: 'sm:col-span-12' },
  },
  md: {
    [1]: { grid: 'grid-cols-1', item: 'md:col-span-1' },
    [2]: { grid: 'grid-cols-2', item: 'md:col-span-2' },
    [3]: { grid: 'grid-cols-3', item: 'md:col-span-3' },
    [4]: { grid: 'grid-cols-4', item: 'md:col-span-4' },
    [5]: { grid: 'grid-cols-5', item: 'md:col-span-5' },
    [6]: { grid: 'grid-cols-6', item: 'md:col-span-6' },
    [7]: { grid: 'grid-cols-7', item: 'md:col-span-7' },
    [8]: { grid: 'grid-cols-8', item: 'md:col-span-8' },
    [9]: { grid: 'grid-cols-9', item: 'md:col-span-9' },
    [10]: { grid: 'grid-cols-10', item: 'md:col-span-10' },
    [11]: { grid: 'grid-cols-11', item: 'md:col-span-11' },
    [12]: { grid: 'grid-cols-12', item: 'md:col-span-12' },
  },
  lg: {
    [1]: { grid: 'grid-cols-1', item: 'lg:col-span-1' },
    [2]: { grid: 'grid-cols-2', item: 'lg:col-span-2' },
    [3]: { grid: 'grid-cols-3', item: 'lg:col-span-3' },
    [4]: { grid: 'grid-cols-4', item: 'lg:col-span-4' },
    [5]: { grid: 'grid-cols-5', item: 'lg:col-span-5' },
    [6]: { grid: 'grid-cols-6', item: 'lg:col-span-6' },
    [7]: { grid: 'grid-cols-7', item: 'lg:col-span-7' },
    [8]: { grid: 'grid-cols-8', item: 'lg:col-span-8' },
    [9]: { grid: 'grid-cols-9', item: 'lg:col-span-9' },
    [10]: { grid: 'grid-cols-10', item: 'lg:col-span-10' },
    [11]: { grid: 'grid-cols-11', item: 'lg:col-span-11' },
    [12]: { grid: 'grid-cols-12', item: 'lg:col-span-12' },
  },
  xl: {
    [1]: { grid: 'grid-cols-1', item: 'xl:col-span-1' },
    [2]: { grid: 'grid-cols-2', item: 'xl:col-span-2' },
    [3]: { grid: 'grid-cols-3', item: 'xl:col-span-3' },
    [4]: { grid: 'grid-cols-4', item: 'xl:col-span-4' },
    [5]: { grid: 'grid-cols-5', item: 'xl:col-span-5' },
    [6]: { grid: 'grid-cols-6', item: 'xl:col-span-6' },
    [7]: { grid: 'grid-cols-7', item: 'xl:col-span-7' },
    [8]: { grid: 'grid-cols-8', item: 'xl:col-span-8' },
    [9]: { grid: 'grid-cols-9', item: 'xl:col-span-9' },
    [10]: { grid: 'grid-cols-10', item: 'xl:col-span-10' },
    [11]: { grid: 'grid-cols-11', item: 'xl:col-span-11' },
    [12]: { grid: 'grid-cols-12', item: 'xl:col-span-12' },
  },
}

export const FormLayout: FormRenderer = ({
  items,
  values,
  onChange,
  className = '',
  children: customFormItemRenderer,
}) => {
  const gridSizeClassName = SIZES_CLASSNAMES.sm[MAX_SIZE_RESOLUTION].grid

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

const getItemSizeClassName = (item: FormItem) => {
  const size = item.layout?.size ?? MAX_SIZE_RESOLUTION

  return typeof size === 'number'
    ? SIZES_CLASSNAMES.sm[size].item
    : Object.entries(size).reduce(
        (className, [breakpoint, size]) =>
          `${className} ${
            SIZES_CLASSNAMES[breakpoint as FormItemSizeBreakpoint][size].item
          }`,
        '',
      )
}
