import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProjectUploadForm from '@/components/project/ProjectUploadForm'

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Add project</CardTitle>
          <CardDescription>
            Upload a ZIP of your Next.js / React app to analyze it with AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectUploadForm />
        </CardContent>
      </Card>
    </div>
  )
}
