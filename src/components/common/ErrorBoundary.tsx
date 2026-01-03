import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="border-destructive/50 bg-destructive/5 my-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Đã xảy ra lỗi {this.props.componentName ? `trong ${this.props.componentName}` : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Không thể tải thành phần này. Vui lòng thử tải lại trang.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-black/5 p-2 rounded text-xs font-mono overflow-auto max-h-40 mb-4 whitespace-pre-wrap">
                                {this.state.error.toString()}
                            </div>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="gap-2"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Thử lại
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
