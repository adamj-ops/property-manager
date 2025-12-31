import { createFileRoute } from '@tanstack/react-router'
import {
  LuArchive,
  LuCalendar,
  LuFileText,
  LuInbox,
  LuMail,
  LuPlus,
  LuSearch,
  LuSend,
  LuStar,
  LuUser,
} from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/communications')({
  component: CommunicationsPage,
})

// Mock data
const messages = [
  {
    id: '1',
    from: 'Emily Rodriguez',
    unit: '204',
    subject: 'Re: Water leak in bathroom ceiling',
    preview: 'The leak is getting worse overnight. Water is dripping into the bathtub. Please help ASAP!',
    date: '2024-12-31T08:45:00',
    unread: true,
    urgent: true,
  },
  {
    id: '2',
    from: 'Sarah Johnson',
    unit: '101',
    subject: 'Lease Renewal Question',
    preview: "Hi Adam, we'd like to renew our lease. Can we discuss the new rent amount? Also, any flexibility on the...",
    date: '2024-12-30T18:30:00',
    unread: true,
    urgent: false,
  },
  {
    id: '3',
    from: "Mike's HVAC Service",
    unit: null,
    subject: 'Re: Unit 305 Emergency Service',
    preview: 'Scheduled for tomorrow 2pm. Parts are in stock. Estimate: $450-650 depending on...',
    date: '2024-12-30T15:15:00',
    unread: false,
    urgent: false,
  },
  {
    id: '4',
    from: 'James Parker',
    unit: '305',
    subject: 'No Heat - Urgent',
    preview: 'Hi, our heat stopped working this morning. It is very cold in the apartment. Please send someone...',
    date: '2024-12-31T07:23:00',
    unread: false,
    urgent: true,
  },
]

const templates = [
  { name: 'Late rent reminder', category: 'Financial' },
  { name: 'Maintenance update', category: 'Maintenance' },
  { name: 'Lease renewal offer', category: 'Leasing' },
  { name: 'Inspection notice (24hr)', category: 'Compliance' },
  { name: 'Violation warning', category: 'Compliance' },
  { name: 'Move-out instructions', category: 'Leasing' },
  { name: 'Pet approval confirmation', category: 'Leasing' },
]

function CommunicationsPage() {
  const unreadCount = messages.filter(m => m.unread).length

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography.H2>Communication Center</Typography.H2>
          <Typography.Muted>Messages and notifications</Typography.Muted>
        </div>
        <Button>
          <LuPlus className='mr-2 size-4' />
          New Message
        </Button>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Sidebar - Compose & Templates */}
        <div className='space-y-6'>
          {/* Compose */}
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>To</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select recipient' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Tenants</SelectItem>
                    <SelectItem value='property'>Humboldt Court Tenants</SelectItem>
                    <SelectItem value='1'>Sarah Johnson - Unit 101</SelectItem>
                    <SelectItem value='2'>Mike Chen - Unit 102</SelectItem>
                    <SelectItem value='3'>Emily Rodriguez - Unit 204</SelectItem>
                    <SelectItem value='4'>James Parker - Unit 305</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Subject</Label>
                <Input placeholder='Message subject...' />
              </div>
              <div className='space-y-2'>
                <Label>Message</Label>
                <Textarea placeholder='Type your message...' className='min-h-32' />
              </div>
              <div className='flex gap-2'>
                <Button className='flex-1'>
                  <LuSend className='mr-2 size-4' />
                  Send
                </Button>
                <Button variant='outline'>
                  <LuCalendar className='mr-2 size-4' />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
              <CardDescription>Pre-written message templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {templates.map((template, i) => (
                  <Button key={i} variant='ghost' className='w-full justify-start text-left' size='sm'>
                    <LuFileText className='mr-2 size-4' />
                    {template.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message List */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <CardTitle>Inbox</CardTitle>
                {unreadCount > 0 && <Badge>{unreadCount} unread</Badge>}
              </div>
              <div className='flex gap-2'>
                <div className='relative'>
                  <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input placeholder='Search messages...' className='pl-10 w-48' />
                </div>
              </div>
            </div>
            {/* Tabs */}
            <div className='flex gap-2 pt-2'>
              <Button variant='secondary' size='sm'>
                <LuInbox className='mr-2 size-4' />
                Inbox
              </Button>
              <Button variant='ghost' size='sm'>
                <LuSend className='mr-2 size-4' />
                Sent
              </Button>
              <Button variant='ghost' size='sm'>
                <LuStar className='mr-2 size-4' />
                Starred
              </Button>
              <Button variant='ghost' size='sm'>
                <LuArchive className='mr-2 size-4' />
                Archived
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 ${
                    message.unread ? 'bg-primary/5 border-primary/20' : ''
                  } ${message.urgent ? 'border-destructive/50' : ''}`}
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-full ${
                      message.unit ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    {message.unit ? (
                      <LuUser className='size-5 text-primary' />
                    ) : (
                      <LuMail className='size-5 text-muted-foreground' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className={`font-medium ${message.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {message.from}
                      </span>
                      {message.unit && (
                        <Badge variant='outline' className='text-xs'>
                          Unit {message.unit}
                        </Badge>
                      )}
                      {message.urgent && (
                        <Badge variant='destructive' className='text-xs'>
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${message.unread ? 'font-medium' : ''}`}>{message.subject}</p>
                    <p className='text-sm text-muted-foreground truncate'>{message.preview}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(message.date).toLocaleDateString()}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(message.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Messages */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Scheduled Messages</CardTitle>
              <CardDescription>Upcoming automated messages</CardDescription>
            </div>
            <Button variant='outline' size='sm'>
              Manage Scheduled
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='rounded-lg border p-4'>
              <div className='flex items-center gap-2'>
                <LuCalendar className='size-4 text-muted-foreground' />
                <span className='text-sm text-muted-foreground'>Jan 1, 2025</span>
              </div>
              <p className='mt-2 font-medium'>Rent reminder to all tenants</p>
              <Badge variant='secondary' className='mt-2'>
                42 recipients
              </Badge>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='flex items-center gap-2'>
                <LuCalendar className='size-4 text-muted-foreground' />
                <span className='text-sm text-muted-foreground'>Jan 3, 2025</span>
              </div>
              <p className='mt-2 font-medium'>Inspection notice to Units 101-110</p>
              <Badge variant='secondary' className='mt-2'>
                10 recipients
              </Badge>
            </div>
            <div className='rounded-lg border p-4'>
              <div className='flex items-center gap-2'>
                <LuCalendar className='size-4 text-muted-foreground' />
                <span className='text-sm text-muted-foreground'>Jan 5, 2025</span>
              </div>
              <p className='mt-2 font-medium'>Lease renewal reminder</p>
              <Badge variant='secondary' className='mt-2'>
                3 recipients
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
