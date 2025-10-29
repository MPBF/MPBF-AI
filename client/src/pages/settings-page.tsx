import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Settings as SettingsIcon, Save } from "lucide-react";
import type { Settings } from "@shared/schema";

const settingsFormSchema = z.object({
  assistantName: z.string().min(1, "اسم المساعد مطلوب / Assistant name is required").max(50, "الاسم طويل جداً / Name is too long"),
  systemInstructions: z.string().min(10, "التوجيهات يجب أن تكون 10 أحرف على الأقل / Instructions must be at least 10 characters").max(2000, "التوجيهات طويلة جداً / Instructions are too long"),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      assistantName: settings?.assistantName || "Modern",
      systemInstructions: settings?.systemInstructions || "أنت مساعد ذكي متخصص في مساعدة الشركات. تتعلم من المحادثات السابقة وتتذكر كل شيء. ساعد المستخدم بطريقة احترافية ومنظمة.",
    },
    values: settings ? {
      assistantName: settings.assistantName,
      systemInstructions: settings.systemInstructions,
    } : undefined,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      return await apiRequest("PATCH", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "تم الحفظ بنجاح / Saved Successfully",
        description: "تم تحديث الإعدادات بنجاح / Settings have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ / Error",
        description: error.message || "فشل في حفظ الإعدادات / Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">جاري التحميل... / Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">الإعدادات / Settings</h1>
            <p className="text-muted-foreground">قم بتخصيص اسم المساعد والتوجيهات الأولية / Customize your assistant's name and initial instructions</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>إعدادات المساعد / Assistant Settings</CardTitle>
            <CardDescription dir="auto">
              قم بتخصيص سلوك المساعد الخاص بك عن طريق تحديد الاسم والتوجيهات الأولية
              <br />
              Customize your assistant's behavior by setting the name and initial instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="assistantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel dir="auto">اسم المساعد / Assistant Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Modern"
                          data-testid="input-assistant-name"
                          dir="auto"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription dir="auto">
                        الاسم الذي سيستخدمه المساعد لتقديم نفسه / The name your assistant will use to introduce itself
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="systemInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel dir="auto">التوجيهات الأولية / Initial Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أنت مساعد ذكي متخصص في مساعدة الشركات..."
                          className="min-h-[200px] resize-none"
                          data-testid="input-system-instructions"
                          dir="auto"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription dir="auto">
                        التوجيهات التي ستوجه سلوك المساعد وشخصيته. استخدم لغة واضحة لوصف كيف يجب أن يتصرف المساعد.
                        <br />
                        Instructions that will guide your assistant's behavior and personality. Use clear language to describe how your assistant should behave.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={updateSettingsMutation.isPending}
                    data-testid="button-reset"
                  >
                    إعادة تعيين / Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الحفظ... / Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        حفظ التغييرات / Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle dir="auto">أمثلة على التوجيهات / Instruction Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2" dir="auto">مساعد احترافي للأعمال / Professional Business Assistant:</h3>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md" dir="auto">
                "أنت مساعد أعمال محترف متخصص في إدارة المشاريع وتنظيم المهام. قدم إجابات دقيقة ومختصرة وركز على الإنتاجية والكفاءة."
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2" dir="auto">مساعد إبداعي / Creative Assistant:</h3>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md" dir="auto">
                "You are a creative and innovative assistant. Help with brainstorming, content creation, and out-of-the-box thinking. Be imaginative and encouraging."
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2" dir="auto">مساعد تقني / Technical Assistant:</h3>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md" dir="auto">
                "أنت مساعد تقني متخصص في البرمجة والتكنولوجيا. قدم حلول تقنية دقيقة مع أمثلة عملية وشرح واضح للمفاهيم المعقدة."
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
