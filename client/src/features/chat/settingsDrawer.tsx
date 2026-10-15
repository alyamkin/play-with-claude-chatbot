import type { useMessageSettings } from './useMessageSettings'

type Props = ReturnType<typeof useMessageSettings> & { onClose: () => void }

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'

export function SettingsDrawer({
  models,
  model,
  setModel,
  maxTokensInput,
  setMaxTokensInput,
  maxTokensLimit,
  maxTokensError,
  stopSequencesInput,
  setStopSequencesInput,
  temperatureInput,
  setTemperatureInput,
  temperatureLimit,
  temperatureSupported,
  temperatureError,
  onClose,
}: Props) {
  // Below lg it overlays the chat from the left; from lg up it sits beside it
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-72 max-w-[85vw] shrink-0 flex-col gap-6 overflow-y-auto border-r border-gray-200 bg-white p-4 shadow-xl lg:static lg:z-auto lg:max-w-none lg:shadow-none">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Message settings</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          ✕
        </button>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
        Model
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={models.length === 0}
          className={fieldClass}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} (${m.inputPrice} / ${m.outputPrice} per 1M)
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
        Max tokens
        <input
          type="number"
          min={1}
          max={maxTokensLimit}
          step={1}
          value={maxTokensInput}
          onChange={(e) => setMaxTokensInput(e.target.value)}
          aria-invalid={!!maxTokensError}
          className={`${fieldClass} ${maxTokensError ? 'border-red-500' : ''}`}
        />
        {maxTokensError && (
          <span role="alert" className="text-xs font-normal text-red-600">
            {maxTokensError}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
        Stop sequences
        <input
          type="text"
          value={stopSequencesInput}
          onChange={(e) => setStopSequencesInput(e.target.value)}
          placeholder="e.g. END, ###"
          className={fieldClass}
        />
        <span className="text-xs font-normal text-gray-500">Comma separated</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
        Temperature
        <input
          type="number"
          min={temperatureLimit.min}
          max={temperatureLimit.max}
          step={0.1}
          value={temperatureInput}
          onChange={(e) => setTemperatureInput(e.target.value)}
          disabled={!temperatureSupported}
          placeholder="Model default"
          aria-invalid={!!temperatureError}
          className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-gray-100 ${temperatureError ? 'border-red-500' : ''}`}
        />
        {temperatureError ? (
          <span role="alert" className="text-xs font-normal text-red-600">
            {temperatureError}
          </span>
        ) : (
          !temperatureSupported && (
            <span className="text-xs font-normal text-gray-500">
              Not supported by the selected model
            </span>
          )
        )}
      </label>
    </aside>
  )
}
