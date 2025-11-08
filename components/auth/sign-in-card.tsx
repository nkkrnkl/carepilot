import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LucideIcon, Mail, Lock, ArrowRight } from "lucide-react";
import { UserType } from "@/lib/constants";

interface SignInCardProps {
  userType: UserType;
  icon: LucideIcon;
  title: string;
  description: string;
  color: {
    bg: string;
    text: string;
    border: string;
    button: string;
    link: string;
  };
  email: string;
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onUserTypeSelect: () => void;
  onSignIn: () => void;
}

export function SignInCard({
  userType,
  icon: Icon,
  title,
  description,
  color,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onUserTypeSelect,
  onSignIn,
}: SignInCardProps) {
  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUserTypeSelect();
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUserTypeSelect();
    onSignIn();
  };

  const borderClass = color.border === "border-blue-300" ? "hover:border-blue-300" : "hover:border-green-300";
  
  return (
    <Card
      className={`border-2 ${borderClass} transition-all cursor-pointer`}
      onClick={onUserTypeSelect}
    >
      <CardHeader className="text-center pb-4">
        <div className={`mx-auto h-16 w-16 rounded-full ${color.bg} flex items-center justify-center mb-4`}>
          <Icon className={`h-8 w-8 ${color.text}`} />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={`email-${userType}`} className="text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id={`email-${userType}`}
                type="email"
                placeholder={`${userType}@example.com`}
                className="pl-10"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                onClick={handleInputClick}
                aria-label={`${userType} email input`}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor={`password-${userType}`} className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id={`password-${userType}`}
                type="password"
                placeholder="Enter your password"
                className="pl-10"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                onClick={handleInputClick}
                aria-label={`${userType} password input`}
              />
            </div>
          </div>
          <Button
            className={`w-full ${color.button} text-white`}
            onClick={handleButtonClick}
            aria-label={`Sign in as ${userType}`}
          >
            Sign In as {title.split(" ")[0]}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
