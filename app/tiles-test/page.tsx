// app/tiles-test/page.tsx - Test page for Tiles component
import { TilesDemo } from "@/components/ui/tiles-demo";
import { Tiles } from "@/components/ui/tiles";

export default function TilesTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Tiles Component Test</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Default Tiles Demo</h2>
          <TilesDemo />
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Small Tiles</h2>
          <div className="w-full h-[300px] border rounded-lg overflow-hidden">
            <Tiles 
              rows={30} 
              cols={15}
              tileSize="sm"
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Large Tiles</h2>
          <div className="w-full h-[400px] border rounded-lg overflow-hidden">
            <Tiles 
              rows={20} 
              cols={8}
              tileSize="lg"
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Custom Styled Tiles</h2>
          <div className="w-full h-[350px] border rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
            <Tiles 
              rows={25} 
              cols={10}
              tileSize="md"
              tileClassName="hover:bg-blue-200 dark:hover:bg-blue-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
}






