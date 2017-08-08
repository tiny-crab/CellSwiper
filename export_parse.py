#!/usr/bin/env python3
import argparse
import pandas as pd
from os import makedirs, getcwd
from os.path import exists, join
from shutil import copy
import sys

def export_parse(input_file, source_path, out_path, failed):
    """
    Takes in an export csv from cellswiper, filter out either the passing or failing annotations,
    and copies those files to the out_path
    """
    try:
        annotations = pd.read_csv(input_file)
    except:
        print("Could not read input file")
        sys.exit(1)
    
    if not exists(source_path):
        print("Source path for images does not exist")
        sys.exit(1)

    # convert from relative to absolute path
    out_path = join(getcwd(), out_path)
    filtered = annotations[annotations['annotation'] == ('f' if failed else 't')]

    try:
        if not exists(out_path):
            makedirs(out_path)
    except:
        print("Could not create out_path " + out_path)
        sys.exit(1)

    failures = 0

    for img in filtered['image_name']:
        try:
            copy(join(source_path, img), join(out_path, img))
        except FileNotFoundError:
            print("Could not find " + img)
            failures += 1
            continue
    
    print("Copy complete")
    print("{} successes, {} failures".format(len(filtered) - failures, failures))
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Parse an export file from cellswiper and copy files that passed annotation to another folder')
    parser.add_argument('input_file', help='file path for annotations csv file to read')
    parser.add_argument('source_path', help='relative path of the folder containing the images to copy')
    parser.add_argument('out_path', help='relative path of target folder to copy to')
    parser.add_argument('-n', '--failed', help='copy failed images instead of passing ones', action="store_true", default=False, required=False)
    try:
        options = parser.parse_args()
    except:
        parser.print_help()
        sys.exit(0)
    args = vars(options)
    export_parse(**args)
    sys.exit(0)
