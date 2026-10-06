import BookingSelect from '../BookingSelect'
import { serviceOptions, type JourneyService } from './serviceData'

export default function ServiceSelect({ value, onChange }: { value: JourneyService; onChange: (value: JourneyService) => void }) {
  return <BookingSelect value={value} onChange={onChange} options={serviceOptions} label="Service" />
}
