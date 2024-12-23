# Temgen

**Temgen** is a CLI tool that generates template files for MERN (MongoDB, Express, React, Node.js) and other stacks, including React with Redux, Next.js, Node.js with Mongoose, or PostgreSQL using Prisma. This package allows you to quickly scaffold projects with predefined templates to streamline your development process.

Visit the [official Temgen homepage](https://temgen.app) for more details and updates.

## Installation

To use `temgen`, you can run it directly using `npx`. This command doesn't require a global installation, but you will need a token to authenticate with the Temgen API.

## Usage

To run the Temgen CLI, use the following command in your terminal:

```bash
npx temgen <token>
```

### Undo Changes

If you need to revert the changes made by the last template generation, you can use the `-undo` flag:

```bash
npx temgen <token> -undo
```

This command will remove all files and empty directories that were created in your last template generation session.
