import sys
import torch
import timm
from PIL import Image
from torchvision import transforms
import os
import json

# --- PATH SETUP ---
# BASE_DIR is 'C:/.../smart agriculture system/services'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# PROJECT_ROOT is 'C:/.../smart agriculture system'
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# AI Model Files (located in the same 'services' folder)
model_path = os.path.join(BASE_DIR, "plant_model.pth")
classes_path = os.path.join(BASE_DIR, "classes.txt")

# Dataset Path (located in the project root)
# Even though the detector doesn't "train" on these, 
# keeping this variable helps with project consistency.
TRAIN_DIR = os.path.join(PROJECT_ROOT, "PlantVillage", "train")

# --- DATA LOADING ---
# Load Class Names
try:
    with open(classes_path, "r") as f:
        CLASSES = [line.strip() for line in f.readlines()]
except FileNotFoundError:
    print(json.dumps({"error": f"classes.txt not found at {classes_path}"}))
    sys.exit(1)

# Load Model Architecture & Weights
def load_model():
    # Number of classes must match the length of classes.txt
    model = timm.create_model('mobilenetv3_large_100', num_classes=len(CLASSES))
    try:
        model.load_state_dict(torch.load(model_path, map_location='cpu'))
    except FileNotFoundError:
        print(json.dumps({"error": f"plant_model.pth not found at {model_path}"}))
        sys.exit(1)
    model.eval()
    return model

model = load_model()

# Match the 128x128 resolution used in your final training
transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# --- EXECUTION LOGIC ---
if __name__ == "__main__":
    try:
        # Node.js sends the image path as the first argument
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No image path provided"}))
            sys.exit(1)

        image_path = sys.argv[1]
        
        # Process the Image
        img = Image.open(image_path).convert("RGB")
        img_t = transform(img).unsqueeze(0)
        
        # Run Inference
        with torch.no_grad():
            output = model(img_t)
            prob = torch.nn.functional.softmax(output[0], dim=0)
            conf, index = torch.max(prob, 0)
        
        # Format Result
        raw_result = CLASSES[index.item()]
        display_result = raw_result.replace("_", " ").title()
        
        output_data = {
            "prediction": display_result,
            "confidence": f"{conf.item()*100:.2f}%",
            "status": "Healthy" if "healthy" in raw_result.lower() else "Diseased"
        }
        
        # Print only the JSON so Node.js can parse it
        print(json.dumps(output_data))

    except Exception as e:
        print(json.dumps({"error": str(e)}))