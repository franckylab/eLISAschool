import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';

type MotionDivProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
    children?: React.ReactNode;
    noAnimation?: boolean;
};

const Card = React.forwardRef<HTMLDivElement, MotionDivProps>(
    ({ className, children, noAnimation, ...props }, ref) => {
        const Component = noAnimation ? 'div' : motion.div;
        const motionProps = noAnimation
            ? {}
            : {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.3 },
              };

        return (
            <Component
                ref={ref}
                className={cn(
                    'group relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm',
                    className,
                )}
                {...motionProps}
                {...(props as any)}
            >
                <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="relative z-10">{children}</div>
            </Component>
        );
    },
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex flex-col space-y-1.5 p-4 sm:p-5', className)} {...props} />
    ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn(
                'text-lg font-semibold leading-none tracking-tight text-foreground',
                className,
            )}
            {...props}
        />
    ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
    ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('p-4 sm:p-5 pt-0', className)} {...props} />
    ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex items-center p-4 sm:p-5 pt-0', className)} {...props} />
    ),
);
CardFooter.displayName = 'CardFooter';

interface CardSectionProps {
    icon?: React.ReactNode;
    title: React.ReactNode;
    description?: string;
    children: React.ReactNode;
    className?: string;
    delay?: number;
    noAnimation?: boolean;
}

const CardSection = React.forwardRef<HTMLDivElement, CardSectionProps>(
    ({ icon, title, description, children, className, delay, noAnimation }, ref) => {
        return (
            <Card
                ref={ref}
                noAnimation={noAnimation}
                className={className}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={delay !== undefined ? { delay, duration: 0.3 } : { duration: 0.3 }}
            >
                <CardHeader>
                    <div className="flex items-center gap-2">
                        {icon && <span className="shrink-0 text-dominant-600">{icon}</span>}
                        <CardTitle>{title}</CardTitle>
                    </div>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <div className="border-b border-border mx-4 sm:mx-5" />
                <CardContent>{children}</CardContent>
            </Card>
        );
    },
);
CardSection.displayName = 'CardSection';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardSection };
