import tensorflow as tf
from tensorflow.keras.models import load_model

# Load the model
model = load_model("audio_classification_model.h5")

# Convert the model to TensorFlow Lite format
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# Ensure batch size is unspecified and doesn't cause issues
model_input_shape = model.input.shape[1:]  # Exclude batch size
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS, tf.lite.OpsSet.SELECT_TF_OPS]

# Perform conversion
tflite_model = converter.convert()

# Save the converted model to a .tflite file
with open("model.tflite", "wb") as f:
    f.write(tflite_model)
