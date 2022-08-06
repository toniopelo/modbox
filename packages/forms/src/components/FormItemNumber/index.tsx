import React from 'react'
import { FormItem, FormItemType, FormValue } from '../../types'

export default function FormItemNumber({
  item,
  value,
  onChange,
  className = '',
  overlapLabel = false,
}: {
  item: FormItem<FormItemType.Number>
  value: FormValue<FormItemType.Number>
  onChange: (number: FormValue<FormItemType.Number>) => void
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
              ? 'absolute -top-2 left-2 -mt-px px-1 bg-white border border-gray-300 h-2.5 border-b-transparent rounded-t-md text-xs'
              : 'text-sm'
          }`}
        >
          {item.label}
        </label>
        <div className={`${overlapLabel ? 'mt-3' : 'mt-1'}`}>
          <input
            // We do not use type="number" as this seems to prevent onChange
            // event to be fired when user type a string but still this is displayed
            // in the input, which prevent us from handling the case easily
            type="text"
            name={item.id}
            id={item.id}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder={item.placeholder}
            // When value is undefined, we put an empty string instead to prevent
            // input to go uncontrolled
            value={value ?? ''}
            onChange={(e) => {
              // Prevent user from entering anything else than a number
              // except an empty value which needs to be updated as empty
              if (e.target.value !== '' && isNaN(+e.target.value)) {
                return
              }
              // When value is empty, we change it to undefined, else we convert it to a number
              onChange(e.target.value === '' ? undefined : +e.target.value)
            }}
            min={item.minValue}
            max={item.maxValue}
          />
        </div>
      </div>
    </div>
  )
}
