import { useMemo, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
// @ts-ignore
import 'moment/locale/tr' 
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Calendar as CalendarIcon, Plus } from 'lucide-react'

// Global ayar (Burası bazen yetmiyor, aşağıda zorlayacağız)
moment.locale('tr')
const localizer = momentLocalizer(moment)

interface CalendarViewProps {
    databaseId: string
    properties: any[]
    pages: any[]
    pageValues: any
    onAddPage: (dateStr: string) => void
    onOpenPage: (pageId: string) => void
}

export default function CalendarView({ properties, pages, pageValues, onAddPage, onOpenPage }: CalendarViewProps) {
    
    const [currentDate, setCurrentDate] = useState(new Date())
    const dateProperty = properties.find(p => p.type === 'date')

    const events = useMemo(() => {
        if (!dateProperty) return []
        const evts: any[] = []
        pages.forEach(page => {
            const val = pageValues[page.id]?.[dateProperty.id]
            if (val && val.date) {
                evts.push({
                    id: page.id,
                    title: page.title || 'İsimsiz',
                    start: new Date(val.date),
                    end: val.end_date ? new Date(val.end_date) : new Date(val.date),
                    allDay: true, 
                    resource: page
                })
            }
        })
        return evts
    }, [pages, pageValues, dateProperty])

    const DateCellWrapper = ({ value, children }: any) => {
        return (
            <div className="h-full w-full relative group">
                {children}
                <button 
                    onClick={(e) => {
                        e.stopPropagation() 
                        const dateStr = moment(value).format('YYYY-MM-DD')
                        onAddPage(dateStr)
                    }}
                    className="absolute top-1 left-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-[#252525] hover:bg-[#373737] text-gray-400 hover:text-white p-0.5 rounded shadow-sm border border-[#373737]"
                    title="Öğe ekle"
                >
                    <Plus size={12} />
                </button>
            </div>
        )
    }

    if (!dateProperty) {
        return (
            <div className="flex flex-col items-center justify-center h-96 border border-dashed border-[#373737] rounded-lg text-gray-500 gap-3 m-4">
                <CalendarIcon size={48} className="opacity-20"/>
                <p>Takvim görünümü için veritabanında en az bir <strong>Tarih (Date)</strong> özelliği olmalıdır.</p>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-200px)] p-4 bg-[#191919]">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                
                views={['month']}
                date={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
                
                culture='tr'
                
                // --- KESİN ÇÖZÜM: LOCALE'İ BURADA ZORLUYORUZ ---
                formats={{
                    monthHeaderFormat: (date) => {
                        // .locale('tr') ekledik, artık kaçarı yok
                        const label = moment(date).locale('tr').format('MMMM YYYY') 
                        return label.charAt(0).toUpperCase() + label.slice(1)
                    },
                    weekdayFormat: (date) => moment(date).locale('tr').format('ddd'), // Pzt, Sal
                }}

                messages={{
                    next: "İleri",
                    previous: "Geri",
                    today: "Bugün",
                    month: "Ay",
                    noEventsInRange: "Bu aralıkta etkinlik yok."
                }}
                
                selectable={false} 
                onSelectEvent={(event) => onOpenPage(event.id)}
                
                components={{
                    dateCellWrapper: DateCellWrapper,
                    event: (props) => (
                        <div className="text-xs px-1 py-0.5 truncate flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span>
                           {props.title}
                        </div>
                    )
                }}
            />
        </div>
    )
}