import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LucideIcon, Mail, User, ArrowRight } from "lucide-react";
import { UserType } from "@/lib/constants";

interface SignUpCardProps {
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
  name: string;
  email: string;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onUserTypeSelect: () => void;
  onSignUp: () => void;
}

export function SignUpCard({
  userType,
  icon: Icon,
  title,
  description,
  color,
  name,
  email,
  onNameChange,
  onEmailChange,
  onUserTypeSelect,
  onSignUp,
}: SignUpCardProps) {
  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUserTypeSelect();
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUserTypeSelect();
    onSignUp();
  };

  const borderClass = color.border === "border-blue-300" ? "hover:border-blue-300" : "hover:border-green-300";
  
  return (
    <Card
      className={`border-2 ${borderClass} transition-all cursor-pointer h-full flex flex-col`}
      onClick={onUserTypeSelect}
    >
      <CardHeader className="text-center pb-4 flex-shrink-0 h-[220px] flex flex-col justify-between">
        <div className={`mx-auto h-16 w-16 rounded-full ${color.bg} flex items-center justify-center mb-4`}>
          <Icon className={`h-8 w-8 ${color.text}`} />
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <CardTitle className="text-2xl mb-3 h-[32px] flex items-center justify-center">{title}</CardTitle>
          <CardDescription className="text-base min-h-[48px] flex items-center justify-center px-2">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-shrink-0">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={`name-${userType}`} className="text-sm font-medium text-gray-700 block h-5">
              Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id={`name-${userType}`}
                type="text"
                placeholder="Enter your name"
                className="pl-10 h-9"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                onClick={handleInputClick}
                aria-label={`${userType} name input`}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor={`email-${userType}`} className="text-sm font-medium text-gray-700 block h-5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id={`email-${userType}`}
                type="email"
                placeholder={`${userType}@example.com`}
                className="pl-10 h-9"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                onClick={handleInputClick}
                aria-label={`${userType} email input`}
              />
            </div>
          </div>
          <Button
            className={`w-full ${color.button} text-white mt-6`}
            onClick={handleButtonClick}
            aria-label={`Sign up as ${userType}`}
          >
            Sign Up as {title.split(" ")[0]}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

