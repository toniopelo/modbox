import React from 'react'
import { FormItem, SelectOption, FormItemType } from '../../types'

export default function FormItemDropdownSelect({
  item,
  onSelect,
  className = '',
  overlapLabel = false,
}: {
  item: FormItem<FormItemType.DropdownSelect>
  onSelect: (option: SelectOption) => void
  className?: string
  overlapLabel?: boolean
}) {
  return (
    <div className={className}>
      {item.contextLabel && (
        <div className="h-8 mb-1 flex items-center">
          <div className="w-1 bg-gray-300 rounded-full h-8 mr-2" />
          <span className="text-gray-500">{item.contextLabel}</span>
        </div>
      )}

      <div className="relative">
        <label
          htmlFor={item.id}
          className={`block font-medium text-gray-700 ${
            overlapLabel
              ? 'absolute -top-2 left-2 bg-white border border-gray-300 h-2.5 border-b-transparent rounded-t-md -mt-px px-1 text-xs'
              : 'text-sm'
          }`}
        >
          {item.label}
        </label>

        <select
          id={item.id}
          name={item.id}
          className={`${
            overlapLabel ? 'mt-3' : 'mt-1'
          } block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md`}
          value={item.value?.label}
          onChange={(e) => {
            const selected: SelectOption | undefined = item.options.find(
              (option) => option.label === e.target.value,
            )
            selected && onSelect(selected)
          }}
        >
          {item.options.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
