import numpy as np
from statistics import mean, median, stdev, variance

def read_data(file_name):
    with open(file_name, 'r') as f:
        data = f.read().splitlines()
    # convert strings to floats
    data = [float(i) for i in data]
    return data

def calculate_mean(data):
    return mean(data)

def calculate_median(data):
    return median(data)

def calculate_standard_deviation(data):
    if len(data) < 2:
        return 0.0  # Return 0 as the standard deviation when there is only one data point
    return stdev(data)

def calculate_variance(data):
    if len(data) < 2:
        return 0.0  # Return 0 as the variance when there is only one data point
    return variance(data)

def print_statistics(data_array, dir, name, file_extension):

    print("_____\n")

    print(name)

    print("_____\n")

    for i, data_val in enumerate(data_array):
        file_name = dir + name + "_" + data_val + file_extension

        data = read_data(file_name)

        #print(data)

        print(data_val)

        print(f"Mean: {calculate_mean(data):.2f}")
        print(f"Median: {calculate_median(data):.2f}")
        print(f"Standard Deviation: {calculate_standard_deviation(data):.2f}")
        print(f"Variance: {calculate_variance(data):.2f}")

        print("_____\n")

def main():
    statistics_dir = "./test/statistics/"
    marketplace_name = "marketplace_test"

    marketplace_0 = "add_product_execution_time"
    marketplace_1 = "add_product_gas_used"
    marketplace_2 = "buy_product_execution_time"
    marketplace_3 = "buy_product_gas_used"
    marketplace_4 = "create_channel_execution_time"
    marketplace_5 = "create_channel_gas_used"
    marketplace_6 = "withdraw_channel_execution_time"
    marketplace_7 = "withdraw_channel_gas_used"

    marketplace_array = [marketplace_0, marketplace_1, marketplace_2, marketplace_3, marketplace_4, marketplace_5, marketplace_6, marketplace_7]

    product_name = "product_test"

    product_0 = "buy_execution_time"
    product_1 = "buy_product_gas_used"
    product_2 = "available_execution_time"
    product_3 = "available_gas_used"
    product_4 = "price_execution_time"
    product_5 = "price_gas_used"
    product_6 = "name_execution_time"
    product_7 = "name_gas_used"
    product_8 = "update_product_execution_time"
    product_9 = "update_product_gas_used"
    product_10 = "owner_execution_time"
    product_11 = "owner_gas_used"

    product_array = [product_0, product_1, product_2, product_3, product_4, product_5, product_6, product_7, product_8, product_9, product_10, product_11]

    bidirectional_name = "bidirectionalchannel_test"

    bidirectional_1 = "change_balance_execution_time"
    bidirectional_2 = "change_balance_gas_used"
    bidirectional_3 = "withdraw_execution_time"
    bidirectional_4 = "withdraw_gas_used"
    bidirectional_5 = "expires_at_execution_time"
    bidirectional_6 = "expires_at_gas_used"
    bidirectional_7 = "deposit_execution_time"
    bidirectional_8 = "deposit_gas_used"
    bidirectional_9 = "contract_balance_execution_time"
    bidirectional_10 = "block_timestamp_execution_time"

    bidirectional_array = [bidirectional_1, bidirectional_2, bidirectional_3, bidirectional_4, bidirectional_5, bidirectional_6, bidirectional_7, bidirectional_8, bidirectional_9, bidirectional_10]

    file_extension = ".txt"

    #############################

    print_statistics(marketplace_array, statistics_dir, marketplace_name, file_extension)

    print_statistics(product_array, statistics_dir, product_name, file_extension)

    print_statistics(bidirectional_array, statistics_dir, bidirectional_name, file_extension)

    

    

if __name__ == "__main__":
    main()
