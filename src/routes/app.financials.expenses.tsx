import { createFileRoute } from '@tanstack/react-router'
import { LuArrowLeft, LuDownload, LuFilter, LuPlus, LuSearch, LuUpload } from 'react-icons/lu'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Typography } from '~/components/ui/typography'

export const Route = createFileRoute('/app/financials/expenses')({
  component: ExpensesPage,
})

// Mock data
const expenses = [
  {
    id: '1',
    description: 'Plumbing repair - Unit 210',
    category: 'Maintenance',
    property: 'Humboldt Court',
    vendor: 'City Plumbing Co.',
    amount: 285,
    date: '2024-12-29',
    workOrderId: '2845',
  },
  {
    id: '2',
    description: 'HVAC service call',
    category: 'Maintenance',
    property: 'Humboldt Court',
    vendor: "Mike's HVAC Service",
    amount: 150,
    date: '2024-12-27',
    workOrderId: '2756',
  },
  {
    id: '3',
    description: 'Property insurance - Q4',
    category: 'Insurance',
    property: 'All Properties',
    vendor: 'State Farm',
    amount: 4200,
    date: '2024-12-01',
  },
  {
    id: '4',
    description: 'Water/sewer - December',
    category: 'Utilities',
    property: 'Humboldt Court',
    vendor: 'Brooklyn Center Utilities',
    amount: 850,
    date: '2024-12-15',
  },
  {
    id: '5',
    description: 'Property management fee',
    category: 'Management',
    property: 'All Properties',
    vendor: 'Self',
    amount: 3600,
    date: '2024-12-01',
  },
]

const categoryTotals = [
  { category: 'Maintenance', total: 2840, budget: 3200 },
  { category: 'Management', total: 3600, budget: 3600 },
  { category: 'Utilities', total: 1250, budget: 1200 },
  { category: 'Insurance', total: 4200, budget: 4200 },
  { category: 'Legal & Admin', total: 450, budget: 600 },
]

function ExpensesPage() {
  const totalExpenses = categoryTotals.reduce((sum, c) => sum + c.total, 0)
  const totalBudget = categoryTotals.reduce((sum, c) => sum + c.budget, 0)

  return (
    <div className='w-full max-w-7xl space-y-6 py-6'>
      {/* Back Button & Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/app/financials'>
            <LuArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <Typography.H2>Expenses</Typography.H2>
          <Typography.Muted>Track and categorize property expenses</Typography.Muted>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <LuDownload className='mr-2 size-4' />
            Export
          </Button>
          <Button>
            <LuPlus className='mr-2 size-4' />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Expenses (Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${totalExpenses.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground'>27.4% of revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${totalBudget.toLocaleString()}</div>
            <p className='text-xs text-green-600'>$460 under budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Maintenance Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>6.3%</div>
            <p className='text-xs text-muted-foreground'>Target: &lt; 8%</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Add Expense Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Expense</CardTitle>
            <CardDescription>Record a new expense</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Description</Label>
              <Input placeholder='e.g., Plumbing repair' />
            </div>
            <div className='space-y-2'>
              <Label>Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='maintenance'>Maintenance</SelectItem>
                  <SelectItem value='utilities'>Utilities</SelectItem>
                  <SelectItem value='insurance'>Insurance</SelectItem>
                  <SelectItem value='taxes'>Taxes</SelectItem>
                  <SelectItem value='management'>Management</SelectItem>
                  <SelectItem value='legal'>Legal & Admin</SelectItem>
                  <SelectItem value='other'>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-4 grid-cols-2'>
              <div className='space-y-2'>
                <Label>Amount</Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
                  <Input type='number' placeholder='0.00' className='pl-7' />
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Date</Label>
                <Input type='date' />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Property</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder='Select property' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Properties</SelectItem>
                  <SelectItem value='1'>Humboldt Court</SelectItem>
                  <SelectItem value='2'>Maple Grove Apartments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Vendor</Label>
              <Input placeholder='Vendor name' />
            </div>
            <div className='space-y-2'>
              <Label>Notes (Optional)</Label>
              <Textarea placeholder='Additional details...' />
            </div>
            <div className='space-y-2'>
              <Label>Receipt</Label>
              <div className='rounded-lg border-2 border-dashed p-4 text-center'>
                <LuUpload className='mx-auto size-6 text-muted-foreground' />
                <p className='mt-1 text-xs text-muted-foreground'>Upload receipt</p>
              </div>
            </div>
            <Button className='w-full'>Add Expense</Button>
          </CardContent>
        </Card>

        {/* Expense List */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Recent Expenses</CardTitle>
              <div className='flex gap-2'>
                <div className='relative'>
                  <LuSearch className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input placeholder='Search...' className='pl-10 w-48' />
                </div>
                <Button variant='outline' size='icon'>
                  <LuFilter className='size-4' />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {expenses.map(expense => (
                <div
                  key={expense.id}
                  className='flex items-center justify-between rounded-lg border p-4'
                >
                  <div>
                    <p className='font-medium'>{expense.description}</p>
                    <div className='flex items-center gap-2 mt-1'>
                      <Badge variant='secondary'>{expense.category}</Badge>
                      <span className='text-sm text-muted-foreground'>{expense.vendor}</span>
                      {expense.workOrderId && (
                        <Badge variant='outline'>WO #{expense.workOrderId}</Badge>
                      )}
                    </div>
                    <p className='text-sm text-muted-foreground mt-1'>{expense.property}</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium'>${expense.amount.toLocaleString()}</p>
                    <p className='text-sm text-muted-foreground'>
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Budget vs Actual by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-5'>
            {categoryTotals.map(category => {
              const variance = category.budget - category.total
              const isOverBudget = variance < 0

              return (
                <div key={category.category} className='rounded-lg border p-4'>
                  <p className='text-sm font-medium'>{category.category}</p>
                  <p className='text-xl font-bold mt-1'>${category.total.toLocaleString()}</p>
                  <p className='text-sm text-muted-foreground'>
                    Budget: ${category.budget.toLocaleString()}
                  </p>
                  <Badge
                    variant='outline'
                    className={isOverBudget ? 'mt-2 border-red-500 text-red-700' : 'mt-2 border-green-500 text-green-700'}
                  >
                    {isOverBudget ? '-' : '+'}${Math.abs(variance).toLocaleString()}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
