# Pull Request Guidelines

This document outlines the standards and best practices for creating comprehensive pull request descriptions for the Barbie project.

---

## 🎯 Purpose

A well-written PR description serves multiple purposes:
- **Communication**: Clearly explains what changes were made and why
- **Review**: Helps reviewers understand the scope and impact
- **Documentation**: Serves as historical reference for future development
- **Quality Assurance**: Ensures all aspects of the change are covered

---

## 📋 PR Description Template

Use the following template structure for all pull requests:

### 1. Header & Overview

```markdown
# Pull Request: [Source Branch] → [Target Branch]

## 📋 Overview

[Brief summary of the PR - 2-3 sentences describing the main purpose]

**Total Changes:** X files changed, Y insertions(+), Z deletions(-)
```

### 2. Key Features Section

Group and categorize all major features/changes:

```markdown
## 🎯 Key Features

### 1. [Feature Name]
[Brief description]

#### Backend Components
- **[Component Category]**
  - [File/module with link] - [Description]
  - Key functionality points
  - Architecture decisions

#### Frontend Components
- **[Component Category]**
  - [File/module with link] - [Description]
  - UI/UX improvements
  - Integration points

#### [Additional Subsections as needed]
- Documentation
- Configuration
- Tests
```

**Best Practices:**
- Use descriptive feature names
- Group related changes together
- Include file links in format: `[filename](file:///absolute/path)`
- Mention line counts for significant files (e.g., "538 lines")
- Separate backend and frontend changes
- Highlight architectural decisions

### 3. Statistics & Metrics

```markdown
## 📊 Statistics

### Code Changes by Category

| Category | Files Changed | Lines Added | Lines Removed |
|----------|---------------|-------------|---------------|
| Backend Logic | X | ~Y | ~Z |
| Frontend Components | X | ~Y | ~Z |
| Tests | X | ~Y | ~Z |
| Documentation | X | ~Y | ~Z |
| Configuration | X | ~Y | ~Z |
| **Total** | **X** | **~Y** | **~Z** |

### Commit Timeline
- **Total Commits:** X commits
- **Date Range:** [Start] - [End]
- **Contributors:** [Names]
```

### 4. Testing Coverage

```markdown
## 🧪 Testing Status

- ✅ [Test category] - X lines
- ✅ [Test category] - Y lines
- ✅ [Integration tests] - Z lines

**Total Test Coverage:** ~X new test lines
```

### 5. Security & Breaking Changes

```markdown
## 🔒 Security Considerations

- ✅ [Security measure implemented]
- ✅ [Authentication/authorization updates]
- ✅ [Data protection measures]

## 🎉 Breaking Changes

**[None/List breaking changes]**

If breaking changes exist:
- Clearly document what breaks
- Provide migration path
- Update version accordingly (semver)
```

### 6. Deployment Notes

```markdown
## 🚀 Deployment Notes

### Required Environment Variables

```env
# [Category]
VARIABLE_NAME=<description>
```

### Migration Steps
1. [Step 1]
2. [Step 2]

### Post-Deployment Verification
- [ ] [Check 1]
- [ ] [Check 2]
```

### 7. Pre-Merge Checklist

```markdown
## ✅ Pre-Merge Checklist

- [x] All new features implemented
- [x] Comprehensive test coverage added
- [x] Documentation updated
- [x] Bug fixes verified
- [x] Environment configuration documented
- [x] CI/CD pipeline passing
- [x] Changelog updated
- [x] Code reviewed
- [x] Manual testing completed
```

---

## 🛠️ Generating PR Descriptions

### Using Git Commands

```bash
# Fetch latest changes
git fetch origin

# Show commits between branches (one-line format)
git log main..preview --oneline

# Show detailed commit info
git log main..preview --pretty=format:"%H|%an|%ad|%s" --date=short

# Show file statistics
git diff main..preview --stat

# Show detailed changes for specific files
git diff main..preview -- path/to/file
```

### Automated Analysis

When analyzing commits for a PR:

1. **Identify commit scope**: `git log base..head --oneline`
2. **Categorize changes**: Group by feature, module, or type
3. **Extract statistics**: Use `git diff --stat` for metrics
4. **Document file changes**: Link to specific files and line ranges
5. **Test coverage**: Count test files and lines added
6. **Dependencies**: Note package.json changes

---

## ✍️ Writing Guidelines

### Language & Tone

- **Clear & Concise**: Avoid jargon; explain complex concepts simply
- **Professional**: Maintain a technical but friendly tone
- **Specific**: Use precise numbers and file references
- **Structured**: Follow consistent formatting throughout

### Content Organization

1. **Top-Down Approach**: Start with high-level overview, drill down to details
2. **Logical Grouping**: Group related changes together
3. **Visual Hierarchy**: Use headers, lists, and tables effectively
4. **Cross-References**: Link related sections and external docs

### Formatting Standards

- Use **GitHub Flavored Markdown**
- Include **emoji indicators** for quick scanning:
  - 🎯 Key Features
  - 📊 Statistics
  - 🧪 Testing
  - 🔒 Security
  - 🚀 Deployment
  - ✅ Checklist
  - 🎉 Breaking Changes
  - 📝 Documentation

- **File Links**: Always use absolute paths
  ```markdown
  Correct: [`filename.js`](file:///absolute/path/to/filename.js)
  Avoid: [filename.js](./relative/path/filename.js)
  ```

- **Code Blocks**: Use appropriate language tags
  ```markdown
  ```javascript
  // code here
  ```
  ```

- **Tables**: Use for structured data comparison

---

## 📏 Quality Criteria

A high-quality PR description should:

- [ ] **Complete**: Cover all changes comprehensively
- [ ] **Accurate**: Match actual code changes
- [ ] **Organized**: Follow template structure
- [ ] **Linked**: Include file and line references
- [ ] **Tested**: Document all test additions
- [ ] **Secure**: Address security implications
- [ ] **Deployable**: Include environment/deployment notes
- [ ] **Reviewable**: Make reviewer's job easy

---

## 🔍 Review Checklist

Before submitting a PR, ensure:

### Content Completeness
- [ ] All features documented
- [ ] All bug fixes listed
- [ ] All breaking changes highlighted
- [ ] All new dependencies explained

### Statistics Accuracy
- [ ] File count matches `git diff --stat`
- [ ] Line counts are approximate but reasonable
- [ ] Commit count is correct
- [ ] Contributors are all listed

### Documentation
- [ ] All new files have descriptions
- [ ] Complex changes are explained
- [ ] Architecture decisions are justified
- [ ] Migration paths are provided (if needed)

### Testing
- [ ] Test coverage is documented
- [ ] Test types are categorized
- [ ] Integration tests are noted
- [ ] Manual testing is described

### Deployment
- [ ] Environment variables are listed
- [ ] Configuration changes are documented
- [ ] Deployment steps are clear
- [ ] Rollback plan exists (for major changes)

---

## 📚 Examples

### Example 1: Feature Addition

```markdown
## 🎯 Key Features

### 1. Admin Dashboard System

Complete admin dashboard with authentication, analytics, and management capabilities.

#### Backend Components
- **Admin Authentication**
  - [`admin.middleware.js`](file:///path/to/admin.middleware.js) - JWT-based admin auth
  - Role-based access control
  - Secure token validation

- **Admin Analytics Repository** (133 lines)
  - Database operations for analytics
  - User growth tracking
  - Financial aggregations
```

### Example 2: Bug Fix

```markdown
## 🐛 Bug Fixes

### Admin Dashboard
- ✅ Fixed income & expense trend chart data display
  - Issue: Charts showed empty data due to incorrect aggregation
  - Fix: Updated pipeline in [`admin.dashboard.service.js`](file:///path)
  - Affected: [`AdminFinancials.jsx`](file:///path)

- ✅ Resolved "No category data available" errors
  - Root cause: Missing null checks in data transformation
  - Solution: Added defensive programming in data service
```

### Example 3: Refactoring

```markdown
## 🔄 Refactoring

### Extract Admin Analytics Repository

**Motivation**: Separate data access logic from business logic for better testability and maintainability.

**Changes**:
- Created new [`admin.analytics.repository.js`](file:///path) (133 lines)
- Moved 8 database query methods from service to repository
- Updated [`admin.dashboard.service.js`](file:///path) to use repository
- Added 200+ lines of repository unit tests

**Benefits**:
- Improved separation of concerns
- Easier to mock for testing
- Reusable across multiple services
```

---

## 🎓 Best Practices Summary

1. **Start with Overview**: Give context before details
2. **Group Logically**: Organize by feature/module/type
3. **Be Specific**: Include file names, line counts, commit hashes
4. **Link Everything**: Make navigation easy for reviewers
5. **Show Impact**: Statistics, metrics, affected areas
6. **Address Security**: Always consider security implications
7. **Document Tests**: Show that changes are verified
8. **Plan Deployment**: Include environment and migration notes
9. **Use Visual Aids**: Tables, checklists, emoji indicators
10. **Proofread**: Check for accuracy and completeness

---

## 📖 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [Semantic Versioning](https://semver.org/)
- Project-specific docs:
  - [`ARCHITECTURE.md`](file:///Users/huanzhang/code/Barbie/docs/ARCHITECTURE.md)
  - [`backend_design_system.md`](file:///Users/huanzhang/code/Barbie/docs/backend_design_system.md)
  - [`FRONTEND_DESIGN_SYSTEM.md`](file:///Users/huanzhang/code/Barbie/docs/FRONTEND_DESIGN_SYSTEM.md)

---

**Last Updated**: 2026-01-28  
**Version**: 1.0.0
