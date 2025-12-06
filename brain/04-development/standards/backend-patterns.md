# Backend Development Patterns - NestJS

**Last Updated:** December 2025
**Status:** Active

This document defines patterns and standards for backend development using NestJS in the Scrollio project.

---

## NestJS Architecture Pattern

Scrollio's backend follows a **layered architecture** with clear separation of concerns:

```
Controller Layer (HTTP/API)
       ↓
Service Layer (Business Logic)
       ↓
Data Access Layer (Supabase Client)
       ↓
Database (PostgreSQL via Supabase)
```

---

## File Structure

### Module Organization

Each feature should be organized as a NestJS module:

```
src/
├── auth/
│   ├── auth.controller.ts      # HTTP endpoints
│   ├── auth.service.ts         # Business logic
│   ├── auth.module.ts          # Module definition
│   ├── dto/                    # Data Transfer Objects
│   │   ├── index.ts
│   │   ├── sign-in.dto.ts
│   │   ├── sign-up.dto.ts
│   │   └── refresh-token.dto.ts
│   └── guards/                 # Auth guards (optional)
│       └── jwt.guard.ts
├── videos/
│   ├── videos.controller.ts
│   ├── videos.service.ts
│   ├── videos.module.ts
│   └── dto/
├── supabase/
│   ├── supabase.service.ts     # Supabase client wrapper
│   └── supabase.module.ts
└── main.ts
```

---

## Controller Pattern

### Structure

```typescript
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('sign-in')
  @ApiOperation({ summary: 'Sign in an existing user' })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Get('profile/:userId')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Param('userId') userId: string) {
    return this.authService.getProfile(userId);
  }
}
```

### Controller Rules

**DO:**
- Keep controllers thin - only handle HTTP concerns
- Use DTOs for request/response validation
- Add Swagger decorators for API documentation
- Use dependency injection for services
- Handle HTTP-specific errors (404, 400, 401, etc.)

**DON'T:**
- Put business logic in controllers
- Access database directly from controllers
- Use `any` types
- Skip DTO validation

---

## Service Pattern

### Structure

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SignInDto, SignUpDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, displayName } = signUpDto;

    // Business logic validation
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Call Supabase service
    const { data, error } = await this.supabaseService.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Create user profile in database
    await this.createUserProfile(data.user.id, displayName);

    return {
      user: data.user,
      session: data.session,
    };
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new BadRequestException('Invalid credentials');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async getProfile(userId: string) {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Profile not found');
    }

    return data;
  }

  private async createUserProfile(userId: string, displayName: string) {
    const { error } = await this.supabaseService.client
      .from('profiles')
      .insert({
        id: userId,
        display_name: displayName,
      });

    if (error) {
      throw new BadRequestException('Failed to create profile');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

### Service Rules

**DO:**
- Implement all business logic in services
- Use constructor injection for dependencies
- Return typed data (define interfaces/types)
- Throw NestJS exceptions (`BadRequestException`, `NotFoundException`, etc.)
- Extract helper methods as private methods
- Handle all Supabase errors appropriately

**DON'T:**
- Access HTTP request/response directly
- Return raw Supabase error objects to clients
- Skip error handling
- Make services do too much (split into multiple services if needed)

---

## DTO (Data Transfer Object) Pattern

### Structure

```typescript
// dto/sign-up.dto.ts
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'StrongPass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Display name for the user',
    example: 'John Doe',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  displayName: string;
}
```

### DTO Rules

**DO:**
- Use `class-validator` decorators for validation
- Add Swagger `@ApiProperty` decorators
- Create separate DTOs for different operations (SignUpDto, SignInDto, UpdateProfileDto)
- Export DTOs from `dto/index.ts`
- Use descriptive property names

**DON'T:**
- Skip validation decorators
- Reuse DTOs when they have different validation rules
- Include internal fields (like hashed passwords)

### DTO Index Export

```typescript
// dto/index.ts
export * from './sign-in.dto';
export * from './sign-up.dto';
export * from './refresh-token.dto';
```

---

## Module Pattern

### Structure

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // Export if other modules need it
})
export class AuthModule {}
```

### Module Rules

**DO:**
- Import required modules in `imports`
- Declare controllers in `controllers`
- Declare services in `providers`
- Export services that other modules need
- Keep modules focused on single feature

**DON'T:**
- Create circular dependencies between modules
- Import unnecessary modules

---

## When to Create New Files

### Create a New Controller When:
- Adding a new API endpoint group (e.g., `/videos`, `/quizzes`)
- The feature has distinct HTTP operations
- You need different route prefixes

### Create a New Service When:
- Implementing business logic for a feature
- Logic becomes too complex in existing service (>200 lines)
- You need shared logic across multiple controllers

### Create a New Module When:
- Adding a new feature domain (auth, videos, quizzes)
- You need to group related controllers and services
- You want to encapsulate feature dependencies

### Create a New DTO When:
- Adding a new API endpoint with different validation rules
- Creating vs updating resources (different required fields)
- Request vs response have different shapes

---

## Supabase Integration Pattern

### Supabase Service (Wrapper)

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  public readonly client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    this.client = createClient(supabaseUrl, supabaseKey);
  }
}
```

### Using Supabase in Services

```typescript
@Injectable()
export class VideosService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getVideosByTopic(topicId: string) {
    const { data, error } = await this.supabaseService.client
      .from('videos')
      .select('*, topics(*)')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch videos: ${error.message}`);
    }

    return data;
  }
}
```

---

## Error Handling

### Standard Exception Pattern

```typescript
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

// Use appropriate exceptions
throw new BadRequestException('Invalid input data');
throw new NotFoundException('Resource not found');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Access denied');
throw new ConflictException('Resource already exists');
```

### Custom Error Messages

```typescript
// Provide context in error messages
throw new BadRequestException({
  message: 'Failed to create video',
  errors: {
    title: 'Title must be between 5-100 characters',
    duration: 'Duration must be less than 60 seconds',
  },
});
```

---

## Testing Pattern

### Service Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseService: SupabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: {
            client: {
              auth: {
                signUp: jest.fn(),
                signInWithPassword: jest.fn(),
              },
              from: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should sign up a new user', async () => {
    const signUpDto = {
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    };

    const mockResponse = {
      data: { user: { id: 'user-id' }, session: {} },
      error: null,
    };

    jest.spyOn(supabaseService.client.auth, 'signUp').mockResolvedValue(mockResponse);

    const result = await service.signUp(signUpDto);
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('session');
  });
});
```

---

## Environment Configuration

### Using ConfigService

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  someMethod() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const dbUrl = this.configService.get<string>('SUPABASE_URL');
  }
}
```

---

## API Documentation (Swagger)

### Enable Swagger in main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Scrollio API')
    .setDescription('Educational video platform API')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('videos')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

---

## Code Organization Checklist

When creating a new backend feature:

- [ ] Create feature module (e.g., `videos.module.ts`)
- [ ] Create controller with Swagger decorators
- [ ] Create service with business logic
- [ ] Create DTOs with validation decorators
- [ ] Export DTOs from `dto/index.ts`
- [ ] Add error handling in service
- [ ] Write unit tests for service
- [ ] Import SupabaseModule if needed
- [ ] Register module in `app.module.ts`
- [ ] Document in `/brain/03-api/`

---

## Common Patterns

### Pagination

```typescript
export class PaginationDto {
  @ApiProperty({ default: 20 })
  @IsNumber()
  limit: number = 20;

  @ApiProperty({ default: 0 })
  @IsNumber()
  offset: number = 0;
}

// Usage
async getVideos(@Query() paginationDto: PaginationDto) {
  return this.videosService.findAll(paginationDto);
}
```

### Filtering

```typescript
export class VideoFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ageGroup?: string;
}
```

---

## Best Practices

1. **Keep it Simple** - Don't over-engineer. Most logic goes in services.
2. **Single Responsibility** - Each service should handle one domain
3. **Dependency Injection** - Use NestJS DI, don't instantiate classes manually
4. **Validation First** - Validate at the DTO level with decorators
5. **Error Handling** - Always handle Supabase errors, provide user-friendly messages
6. **Type Everything** - Use TypeScript interfaces for all data shapes
7. **Test Services** - Focus testing on service layer (business logic)

---

**See Also:**
- Frontend patterns: `/brain/04-development/standards/component-patterns.md`
- API documentation: `/brain/03-api/`
- Database schema: `/brain/01-architecture/database-schema.md`
