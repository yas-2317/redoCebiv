import { getPrimaryStack } from '@/lib/stacks/primary'

export interface StackPromptContext {
  appDescription: string
  stackSummary: string
  usecaseGuidance: string
  challengeGuidance: string
  traceGuidance: string
  proposalGuidance: string
  gradingPatternLabel: string
  examples: {
    challengeFileSelectionExample: string
    challengeCodeChoiceExample: string
    traceExample: string
    proposalExample: string
  }
}

function buildStackSummary(projectStack: string[]) {
  return projectStack.length > 0 ? projectStack.join(' / ') : 'application code'
}

function createExamples(params: {
  file: string
  file2?: string
  code: string
  before?: string
  correctChoice: string
  wrongChoices: string[]
  role: string
  flowLabel: string
  flowDescription: string
  flowSnippet: string
  proposalReason: string
  proposalChangeType: string
  explanation: string
}) {
  const {
    file,
    file2,
    code,
    before,
    correctChoice,
    wrongChoices,
    role,
    flowLabel,
    flowDescription,
    flowSnippet,
    proposalReason,
    proposalChangeType,
    explanation,
  } = params

  // Next.js / React and other generic web stacks intentionally fall through here.
  return {
    challengeFileSelectionExample: `{
  "title": "Disable submit when input is empty",
  "description": "Prevent submission when the required input is blank",
  "type": "validation",
  "difficulty": 2,
  "format": "file_selection",
  "answer": {
    "correct_files": ["${file}"${file2 ? `, "${file2}"` : ''}],
    "correct_code": "${code}",
    "explanation": "${explanation}",
    "change_type": "Add validation",
    "related_examples": []
  },
  "hint": "Look for the place that controls whether the primary action can run"
}`,
    challengeCodeChoiceExample: `{
  "title": "Fix the disabled condition",
  "description": "The primary action should be disabled while loading or when the input is empty. Choose the correct code.",
  "type": "condition",
  "difficulty": 5,
  "format": "code_choice",
  "answer": {
    "correct_files": ["${file}"],
    "current_code": "${before ?? code}",
    "choices": [
      "${correctChoice}",
      "${wrongChoices[0]}",
      "${wrongChoices[1]}",
      "${wrongChoices[2]}"
    ],
    "correct_index": 0,
    "correct_code": "${correctChoice}",
    "explanation": "${explanation}",
    "change_type": "Fix condition",
    "related_examples": []
  },
  "hint": "Check the boolean logic around the main action state"
}`,
    traceExample: `{
  "related_files": [
    {
      "path": "${file}",
      "role": "${role}",
      "keyLines": [18, 24]
    }
  ],
  "flow": [
    {
      "step": 1,
      "label": "${flowLabel}",
      "description": "${flowDescription}",
      "file": "${file}",
      "line": 18,
      "snippet": "${flowSnippet}"
    }
  ],
  "explanation": "You wanted users to complete the action from the main screen, so the AI wired the input and submit logic through this feature path."
}`,
    proposalExample: `{
  "change_type": "validation",
  "difficulty": 2,
  "candidates": [
    {
      "file": "${file}",
      "line": 18,
      "codeSnippet": "${code}",
      "reason": "${proposalReason}",
      "changeType": "${proposalChangeType}"
    }
  ]
}`,
  }
}

export function getStackPromptContext(projectStack: string[] = []): StackPromptContext {
  const stackSummary = buildStackSummary(projectStack)
  const primaryStack = getPrimaryStack(projectStack)

  if (primaryStack === 'Flutter') {
    return {
      appDescription: `${stackSummary} mobile app`,
      stackSummary,
      usecaseGuidance: 'Treat screens, widgets, navigation flows, forms, local state, and provider/service interactions as first-class feature entry points. Dart widgets may spread one user flow across multiple files.',
      challengeGuidance: 'When creating beginner challenges, prefer widget tree edits, validation, button state, conditional rendering, navigation triggers, and provider/state updates. Use Dart / Flutter syntax in examples.',
      traceGuidance: 'Explain the flow in Flutter terms: screen/widget tree, callbacks, state changes, controller/provider updates, and UI rebuilds.',
      proposalGuidance: 'Look for the most direct widget, state holder, validator, or service call that controls the requested change. Use Flutter terminology.',
      gradingPatternLabel: 'Flutter widget/state-management pattern',
      examples: createExamples({
        file: 'lib/screens/task_form_screen.dart',
        file2: 'lib/widgets/primary_submit_button.dart',
        code: 'onPressed: textController.text.trim().isEmpty ? null : submitTask,',
        before: 'onPressed: isLoading ? null : submitTask,',
        correctChoice: 'onPressed: isLoading || textController.text.trim().isEmpty ? null : submitTask,',
        wrongChoices: [
          'onPressed: isLoading ? submitTask : null,',
          'onPressed: textController.text.isEmpty && isLoading ? null : submitTask,',
          'onPressed: textController.text.trim().isEmpty ? submitTask : null,',
        ],
        role: 'Screen widget and submit action wiring',
        flowLabel: 'Tap Submit',
        flowDescription: 'The user taps the primary button after entering text into the form field.',
        flowSnippet: "final isDisabled = isLoading || textController.text.trim().isEmpty;\\nElevatedButton(\\n  onPressed: isDisabled ? null : submitTask,\\n)",
        proposalReason: 'This widget directly controls whether the submit button is enabled, so it is the clearest place to change validation behavior.',
        proposalChangeType: 'Add validation',
        explanation: 'This widget decides when the primary action is enabled, so it is the right place to enforce empty-input validation in Flutter.',
      }),
    }
  }

  if (primaryStack === 'Swift') {
    return {
      appDescription: `${stackSummary} Apple platform app`,
      stackSummary,
      usecaseGuidance: 'Treat SwiftUI views, UIKit view controllers, navigation flows, bindings, observable state, and service/model updates as the main feature entry points.',
      challengeGuidance: 'Prefer beginner-friendly challenges around view text, button state, input validation, conditional sections, navigation, and model/service updates. Use Swift / SwiftUI terminology in examples.',
      traceGuidance: 'Explain the flow in SwiftUI / iOS terms: view, user action, binding/state update, model/service call, and rendered result.',
      proposalGuidance: 'Point to the most direct View, ViewModel, model, or action handler that controls the requested change. Use Apple-platform terminology.',
      gradingPatternLabel: 'SwiftUI / iOS implementation pattern',
      examples: createExamples({
        file: 'Features/Tasks/TaskFormView.swift',
        file2: 'Features/Tasks/TaskViewModel.swift',
        code: 'Button("Save") { viewModel.save() }.disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)',
        before: 'Button("Save") { viewModel.save() }.disabled(isSaving)',
        correctChoice: 'Button("Save") { viewModel.save() }.disabled(isSaving || title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)',
        wrongChoices: [
          'Button("Save") { viewModel.save() }.disabled(isSaving && title.isEmpty)',
          'Button("Save") { viewModel.save() }.disabled(title.isEmpty ? false : isSaving)',
          'Button("Save") { viewModel.save() }.disabled(title.isEmpty)',
        ],
        role: 'SwiftUI form view and save action state',
        flowLabel: 'Tap Save',
        flowDescription: 'The user enters a title and taps the save button in the form view.',
        flowSnippet: '@State private var title = ""\\nButton("Save") { viewModel.save() }\\n  .disabled(isSaving || title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)',
        proposalReason: 'This view owns the button state, so it is the most direct and beginner-friendly place to adjust the save validation.',
        proposalChangeType: 'Add validation',
        explanation: 'The SwiftUI view controls the button state, so this is where the app decides if the save action should be available.',
      }),
    }
  }

  if (primaryStack === 'Ruby on Rails') {
    return {
      appDescription: `${stackSummary} web application`,
      stackSummary,
      usecaseGuidance: 'Treat routes, controllers, views, forms, model validations, and background actions as the main implementation units for user-facing behavior.',
      challengeGuidance: 'Prefer challenges around form handling, controller conditions, validation messages, view text, partial rendering, and model validation rules. Use Rails terminology in examples.',
      traceGuidance: 'Explain the flow in Rails terms: route -> controller -> model/service -> view render/update.',
      proposalGuidance: 'Point to the most direct route/controller/view/model location that controls the requested behavior. Use Rails terminology.',
      gradingPatternLabel: 'Rails MVC pattern',
      examples: createExamples({
        file: 'app/views/tasks/_form.html.erb',
        file2: 'app/models/task.rb',
        code: '<%= f.submit "Save", disabled: @task.title.to_s.strip.empty? %>',
        before: '<%= f.submit "Save", disabled: @task.saving? %>',
        correctChoice: '<%= f.submit "Save", disabled: @task.saving? || @task.title.to_s.strip.empty? %>',
        wrongChoices: [
          '<%= f.submit "Save", disabled: @task.saving? && @task.title.blank? %>',
          '<%= f.submit "Save", disabled: false unless @task.title.blank? %>',
          '<%= f.submit "Save", disabled: @task.title.blank? ? false : @task.saving? %>',
        ],
        role: 'Form partial that renders the submit action',
        flowLabel: 'Submit Form',
        flowDescription: 'The user fills in the task form and submits it from the rendered partial.',
        flowSnippet: '<%= form_with model: @task do |f| %>\\n  <%= f.text_field :title %>\\n  <%= f.submit "Save", disabled: @task.title.to_s.strip.empty? %>\\n<% end %>',
        proposalReason: 'This partial renders the submit button itself, so it is the most direct place to change the form button state.',
        proposalChangeType: 'Add validation',
        explanation: 'The form partial renders and configures the submit button, which makes it the right place for this Rails validation behavior.',
      }),
    }
  }

  if (primaryStack === 'Python') {
    return {
      appDescription: `${stackSummary} application`,
      stackSummary,
      usecaseGuidance: 'Treat request handlers, templates, forms, validation logic, view functions, and service modules as the main user-facing entry points.',
      challengeGuidance: 'Prefer challenges around request handling, validation, template output, conditional branches, and service-layer edits. Use Python web-app terminology in examples.',
      traceGuidance: 'Explain the flow in framework-agnostic Python app terms: request/input -> handler -> validation/business logic -> response or rendered output.',
      proposalGuidance: 'Point to the most direct handler, template, validation, or service function that controls the requested behavior.',
      gradingPatternLabel: 'Python application pattern',
      examples: createExamples({
        file: 'app/forms/task_form.py',
        file2: 'app/templates/task_form.html',
        code: 'is_submit_disabled = is_saving or not title.strip()',
        before: 'is_submit_disabled = is_saving',
        correctChoice: 'is_submit_disabled = is_saving or not title.strip()',
        wrongChoices: [
          'is_submit_disabled = is_saving and not title.strip()',
          'is_submit_disabled = title.strip()',
          'is_submit_disabled = False if title.strip() else is_saving',
        ],
        role: 'Form handler and submit-state logic',
        flowLabel: 'Submit Request',
        flowDescription: 'The user submits the form, and the handler validates the input before processing.',
        flowSnippet: 'title = request.form.get("title", "")\\nis_submit_disabled = is_saving or not title.strip()\\nreturn render_template("task_form.html", is_submit_disabled=is_submit_disabled)',
        proposalReason: 'This handler computes the submit state before rendering the template, so it is the most direct place to change the validation behavior.',
        proposalChangeType: 'Add validation',
        explanation: 'The handler computes whether the action is allowed, so it is the correct place to enforce this Python-side validation rule.',
      }),
    }
  }

  if (primaryStack === 'Vue' || primaryStack === 'Nuxt') {
    return {
      appDescription: `${stackSummary} web app`,
      stackSummary,
      usecaseGuidance: 'Treat pages, Vue single-file components, composables, stores, and route actions as main feature entry points.',
      challengeGuidance: 'Prefer challenges around template text, v-if/v-show conditions, form validation, computed state, emits, and store updates. Use Vue / Nuxt syntax in examples.',
      traceGuidance: 'Explain the flow in Vue terms: page/component event -> reactive state/composable/store -> rendered template update.',
      proposalGuidance: 'Point to the most direct component, composable, store, or route file that controls the requested change.',
      gradingPatternLabel: 'Vue / Nuxt reactive pattern',
      examples: createExamples({
        file: 'components/TaskForm.vue',
        file2: 'composables/useTaskForm.ts',
        code: ':disabled=\"isLoading || title.trim() === \'\'\"',
        before: ':disabled="isLoading"',
        correctChoice: ':disabled="isLoading || title.trim() === \'\'"',
        wrongChoices: [
          ':disabled="isLoading && title.trim() === \'\'"',
          ':disabled="title.trim() === \'\' ? false : isLoading"',
          ':disabled="title === \'\'"',
        ],
        role: 'Vue component template and reactive button state',
        flowLabel: 'Click Submit',
        flowDescription: 'The user types into the input and clicks the submit button in the component.',
        flowSnippet: "const title = ref('')\\n<button :disabled=\"isLoading || title.trim() === ''\">Save</button>",
        proposalReason: 'This component template directly binds the disabled state, making it the clearest place to update the validation behavior.',
        proposalChangeType: 'Add validation',
        explanation: 'The component controls the reactive disabled state, so this Vue file is the right place to enforce the rule.',
      }),
    }
  }

  if (primaryStack === 'Svelte' || primaryStack === 'SvelteKit') {
    return {
      appDescription: `${stackSummary} web app`,
      stackSummary,
      usecaseGuidance: 'Treat routes, Svelte components, stores, load actions, and reactive statements as the main feature entry points.',
      challengeGuidance: 'Prefer challenges around markup text, reactive conditions, form handling, store updates, and route actions. Use Svelte syntax in examples.',
      traceGuidance: 'Explain the flow in Svelte terms: component event -> reactive/store update -> rendered output update.',
      proposalGuidance: 'Point to the most direct component, store, or route/action file that controls the requested behavior.',
      gradingPatternLabel: 'Svelte reactive pattern',
      examples: createExamples({
        file: 'src/lib/components/TaskForm.svelte',
        file2: 'src/lib/stores/taskForm.ts',
        code: 'disabled={isLoading || title.trim() === ""}',
        before: 'disabled={isLoading}',
        correctChoice: 'disabled={isLoading || title.trim() === ""}',
        wrongChoices: [
          'disabled={isLoading && title.trim() === ""}',
          'disabled={title ? isLoading : false}',
          'disabled={title === ""}',
        ],
        role: 'Svelte component and reactive submit state',
        flowLabel: 'Submit Action',
        flowDescription: 'The user updates the bound input and triggers the primary action from the component.',
        flowSnippet: 'let title = ""\\n<button disabled={isLoading || title.trim() === ""}>Save</button>',
        proposalReason: 'This component owns the disabled state of the primary action, so it is the most direct place to adjust the behavior.',
        proposalChangeType: 'Add validation',
        explanation: 'The Svelte component directly controls the action state, so it is the right file for this reactive rule.',
      }),
    }
  }

  return {
    appDescription: `${stackSummary} web app`,
    stackSummary,
    usecaseGuidance: 'Treat pages, components, routes, state containers, forms, and service calls as the main user-facing feature entry points.',
    challengeGuidance: 'Prefer beginner-friendly challenges around text changes, validation, conditional rendering, button state, data flow, and small cross-file edits. Match examples to the detected stack when possible.',
    traceGuidance: 'Explain the flow using the stack\'s own concepts: screen/page -> user event -> state/data update -> rendered result.',
    proposalGuidance: 'Point to the most direct UI, handler, state, or service location that controls the requested behavior. Use stack-appropriate terminology.',
    gradingPatternLabel: 'implementation pattern',
    examples: createExamples({
      file: 'src/components/TaskForm.tsx',
      file2: 'src/hooks/useTaskForm.ts',
      code: 'disabled={isLoading || title.trim() === ""}',
      before: 'disabled={isLoading}',
      correctChoice: 'disabled={isLoading || title.trim() === ""}',
      wrongChoices: [
        'disabled={isLoading && title.trim() === ""}',
        'disabled={title ? isLoading : false}',
        'disabled={title === ""}',
      ],
      role: 'Form UI and primary action state',
      flowLabel: 'Input',
      flowDescription: 'The user enters text and triggers the primary form action.',
      flowSnippet: "const [title, setTitle] = useState('')\\n<button disabled={isLoading || title.trim() === ''}>Save</button>",
      proposalReason: 'This file directly controls the action state in the UI, so it is the easiest place for a beginner to make the requested change.',
      proposalChangeType: 'Add validation',
      explanation: 'This file controls whether the main action is enabled, so it is the right place to apply the validation logic.',
    }),
  }
}
