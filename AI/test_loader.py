from Utils.Model_Loader import ModelLoader

loader = ModelLoader()
model, prep = loader.get_price_model()

print(type(model))
print(type(prep))
