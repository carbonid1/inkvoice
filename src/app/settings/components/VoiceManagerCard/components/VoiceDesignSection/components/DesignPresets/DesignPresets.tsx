import { Button } from '@carbonid1/design-system'
import { Sparkles } from 'lucide-react'
import {
  ATTRIBUTE_ORDER,
  type AttributeValues,
  DESIGN_PRESETS,
} from '../../VoiceDesignSection.consts'

interface Props {
  attributes: AttributeValues
  onSelect: (attrs: AttributeValues) => void
}

const attributesEqual = (a: AttributeValues, b: AttributeValues): boolean =>
  ATTRIBUTE_ORDER.every(key => a[key] === b[key])

export const DesignPresets = ({ attributes, onSelect }: Props) => (
  <div className="space-y-1">
    <p className="text-muted-foreground text-xs font-medium">Quick starts</p>
    <div className="flex flex-wrap gap-2">
      {DESIGN_PRESETS.map(preset => {
        const active = attributesEqual(attributes, preset.attrs)

        return (
          <Button
            key={preset.id}
            type="button"
            variant={active ? 'primary' : 'outline'}
            size="default"
            onClick={() => onSelect(preset.attrs)}
            aria-pressed={active}
          >
            <Sparkles className="size-3.5" />
            {preset.label}
          </Button>
        )
      })}
    </div>
  </div>
)
